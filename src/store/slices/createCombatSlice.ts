import { StateCreator } from 'zustand';
import { GameStore } from '../../types/storeTypes';
import { CombatLog, CombatPlaybackData } from '../../types';
import { ITEMS_DATA } from '../../utils/gameData';
import { getAbyssEnemy, BASE_ARENA_NPCS } from '../../utils/generators';

export const createCombatSlice: StateCreator<GameStore, [], [], any> = (set, get) => ({
  executeArenaBattle: (slaveId, npcId) => {
    const state = get(); const slave = state.slaves.find(s => s.id === slaveId); const npc = state.arenaNPCs.find(n => n.id === npcId);
    if (!slave || !npc || state.player.actionPoints < 1) return null;

    let weaponAtk = 0; if (slave.equipment?.weaponId && ITEMS_DATA[slave.equipment.weaponId]) weaponAtk = ITEMS_DATA[slave.equipment.weaponId].effect.attack || 0;

    const combatStat = slave.isInjured ? Math.floor(slave.primaryStats.combat * 0.5) : slave.primaryStats.combat;
    const enduranceStat = slave.isInjured ? Math.floor(slave.primaryStats.endurance * 0.5) : slave.primaryStats.endurance;
    const intelligenceStat = slave.isInjured ? Math.floor(slave.primaryStats.intelligence * 0.5) : slave.primaryStats.intelligence;
    const combatSkill = slave.isInjured ? Math.floor((slave.skills?.combat || 1) * 0.5) : (slave.skills?.combat || 1);
    const survivalSkill = slave.isInjured ? Math.floor((slave.skills?.survival || 1) * 0.5) : (slave.skills?.survival || 1);
    const sLuck = slave.primaryStats.luck ?? 10;
    
    let sHpMax = Math.floor(enduranceStat * 5); let sHp = Math.floor(sHpMax * (slave.conditionStats.stamina / 100));
    let sAtk = combatStat + weaponAtk; let sDef = Math.floor(enduranceStat * 0.5 + survivalSkill * 2); let sSpd = intelligenceStat;
    let sDmgMulti = 1 + (combatSkill * 0.05); let sDmgReduc = combatSkill * 0.03;

    if (slave.race === '精靈') sSpd = Math.floor(sSpd * 1.2);
    if (slave.race === '半獸人') { sAtk = Math.floor(sAtk * 1.15); sDef = Math.floor(sDef * 0.9); }
    if (slave.race === '矮人') { sHpMax = Math.floor(sHpMax * 1.2); sHp = Math.floor(sHp * 1.2); sDef = Math.floor(sDef * 1.15); }
    if (slave.race === '龍族') { sAtk = Math.floor(sAtk * 1.1); sDef = Math.floor(sDef * 1.1); sSpd = Math.floor(sSpd * 1.1); sDmgReduc += 0.2; }

    let nHpMax = npc.stats.endurance * 5; let nHp = nHpMax;
    let nAtk = npc.stats.combat; let nDef = Math.floor(npc.stats.endurance * 0.5); 
    let nSpd = npc.stats.intelligence; let nLuck = npc.stats.luck; let nCharisma = npc.stats.charisma;

    const logs: CombatLog[] = []; 
    logs.push({ round: 0, message: `［系統］${slave.name} 踏入賽場，迎戰 ${npc.name}。`, type: 'system', sHp, nHp });

    if (slave.race === '精靈') logs.push({ round: 0, message: `［風之眷顧］${slave.name} 身形如風奪得先手，首擊傷害大幅增幅！`, type: 'skill', sHp, nHp });
    if (slave.race === '半獸人') logs.push({ round: 0, message: `［狂熱戰血］${slave.name} 點燃了怒火，放棄防禦以換取更具破壞力的重擊！`, type: 'skill', sHp, nHp });
    if (slave.race === '矮人') logs.push({ round: 0, message: `［堅岩體魄］${slave.name} 展現了北地體格，肌肉宛如磐石般堅不可摧！`, type: 'skill', sHp, nHp });
    if (slave.race === '龍族') logs.push({ round: 0, message: `［真龍威壓］${slave.name} 釋放了上位威壓，全屬性增幅並獲得巨額減傷！`, type: 'skill', sHp, nHp });
    if (slave.race === '人類') logs.push({ round: 0, message: `［絕境意志］${slave.name} 懷抱求生潛能，瀕死狀態下攻擊力將大幅爆發。`, type: 'skill', sHp, nHp });
    if (slave.race === '不死族') logs.push({ round: 0, message: `［枯骨不朽］${slave.name} 散發著死氣，其攻擊能精準汲取敵人的生命力。`, type: 'skill', sHp, nHp });

    let round = 1; let orcStack = 0; let humanUnstoppable = false;

    while (sHp > 0 && nHp > 0 && round <= 50) {
      const isSlaveFirst = sSpd >= nSpd;
      const slaveAction = () => {
        if (sHp <= 0) return; let atkPower = sAtk; let dmgMulti = sDmgMulti;
        if (slave.race === '人類' && sHp < sHpMax * 0.4 && !humanUnstoppable) { humanUnstoppable = true; logs.push({ round, message: `［絕境意志］${slave.name} 爆發強烈的求生欲，攻擊力極大幅提升！`, type: 'skill', sHp, nHp }); }
        if (humanUnstoppable) atkPower = Math.floor(atkPower * 1.25);
        if (slave.race === '精靈' && isSlaveFirst) dmgMulti += 0.15;
        if (slave.race === '半獸人') dmgMulti += Math.min(0.3, orcStack * 0.03);

        const nDodgeRate = Math.min(0.20, (nLuck / 100) * 0.20);
        if (Math.random() < nDodgeRate) {
            logs.push({ round, message: `［閃避］${npc.name} 驚險地避開了 ${slave.name} 的致命一擊！`, type: 'skill', sHp, nHp });
        } else {
            let dmg = Math.floor(Math.max(1, atkPower - nDef) * dmgMulti); 
            const sCritRate = Math.min(0.30, (sLuck / 100) * 0.30);
            if (Math.random() < sCritRate) {
                dmg = Math.floor(dmg * 1.5);
                logs.push({ round, message: `［爆擊］${slave.name} 抓住了轉瞬即逝的破綻，造成 1.5 倍爆擊傷害！`, type: 'damage', sHp, nHp });
            }
            nHp -= dmg; nHp = Math.max(0, nHp);
            logs.push({ round, message: `${slave.name} 發動攻擊，對 ${npc.name} 造成 ${dmg} 點傷害。`, type: 'damage', sHp, nHp, damage: dmg });
            if (slave.race === '不死族') { const heal = Math.floor(dmg * 0.15); if (heal > 0) { sHp = Math.min(sHpMax, sHp + heal); logs.push({ round, message: `［枯骨不朽］${slave.name} 吸收了 ${heal} 點生命力。`, type: 'heal', sHp, nHp, damage: heal }); } }
        }
      };
      const npcAction = () => {
        if (nHp <= 0) return; 
        const sDodgeRate = Math.min(0.20, (sLuck / 100) * 0.20);
        if (Math.random() < sDodgeRate) {
            logs.push({ round, message: `［閃避］${slave.name} 靈巧地避開了 ${npc.name} 的攻擊！`, type: 'skill', sHp, nHp });
        } else {
            let dmg = Math.max(1, nAtk - sDef); 
            if (slave.race === '矮人') { dmg = Math.max(1, dmg - 5); logs.push({ round, message: `［天賦防禦］${slave.name} 的【堅岩體魄】使其硬生生抵擋並折抵了 5 點致命傷害！`, type: 'skill', sHp, nHp }); }
            dmg = Math.floor(dmg * (1 - sDmgReduc)); 
            
            const nCritRate = Math.min(0.30, (nLuck / 100) * 0.30);
            if (Math.random() < nCritRate) {
                dmg = Math.floor(dmg * 1.5);
                logs.push({ round, message: `［爆擊］${npc.name} 的攻勢異常兇猛，對 ${slave.name} 造成 1.5 倍爆擊傷害！`, type: 'damage', sHp, nHp });
            }
            sHp -= dmg; sHp = Math.max(0, sHp);
            logs.push({ round, message: `${npc.name} 揮舞武器，對 ${slave.name} 造成 ${dmg} 點傷害。`, type: 'damage', sHp, nHp, damage: dmg });
            if (slave.race === '半獸人') { orcStack++; logs.push({ round, message: `［天賦層數］${slave.name} 承受攻擊，痛苦激發狂暴！`, type: 'skill', sHp, nHp }); }
        }
      };
      if (isSlaveFirst) { slaveAction(); npcAction(); } else { npcAction(); slaveAction(); }
      round++;
    }

    const isWin = sHp > 0;
    let newWins = slave.combatRecord?.wins || 0;
    let newLosses = slave.combatRecord?.losses || 0;
    let isInjuredNow = slave.isInjured || false;
    let newStamina = Math.max(0, slave.conditionStats.stamina - 20);

    if (isWin) {
      newWins++;
      logs.push({ round: round - 1, message: `［結算］${slave.name} 屹立到了最後，取得勝利。`, type: 'system', sHp, nHp });
      
      const charismaBonus = 1 + Math.floor(nCharisma / 10) * 0.05;
      const finalRewardGold = Math.floor(npc.rewardGold * charismaBonus);
      get().addGold(finalRewardGold); 
      if (npc.rewardPrestige > 0) get().addPrestige(npc.rewardPrestige);
      
      const foodReward = Math.floor(Math.random() * 11) + 5;
      get().addFood(foodReward);
      logs.push({ round: round - 1, message: `［戰利品附加］在對手身上搜刮到口糧 ${foodReward} 單位。`, type: 'system', sHp, nHp });

      if (charismaBonus > 1) {
          logs.push({ round: round - 1, message: `［戰利品加成］擊敗高魅力對手，資金獲得額外加成，共計獲取 ${finalRewardGold}！`, type: 'system', sHp, nHp });
      }

      const netWins = newWins - newLosses;
      if (netWins > 0 && netWins % 5 === 0) {
        const pool = ['combat', 'endurance', 'intelligence', 'charisma', 'luck'] as const;
        const picked = pool[Math.floor(Math.random() * pool.length)];
        slave.primaryStats[picked] = Math.min(100, (slave.primaryStats[picked] ?? 10) + 1);
        const nameMap = { combat: '武力', endurance: '體質', intelligence: '智力', charisma: '魅力', luck: '幸運' };
        logs.push({ round: round - 1, message: `歷練突破！${slave.name} 累積淨勝場達 ${netWins} 場，【${nameMap[picked]}】永久提升 1 點！`, type: 'skill', sHp, nHp });
      }
      
      set(s => {
        const newNpcs = s.arenaNPCs.filter(n => n.id !== npcId);
        const baseMatch = BASE_ARENA_NPCS.find(b => b.location === npc.location) || BASE_ARENA_NPCS[0];
        const rand = Math.random();
        let prefix = ''; let cStats = { ...baseMatch.stats };
        if (rand < 0.33) { prefix = '【狂暴的】'; cStats.combat = Math.floor(cStats.combat * 1.15); cStats.endurance = Math.floor(cStats.endurance * 0.85); }
        else if (rand < 0.66) { prefix = '【鐵壁的】'; cStats.endurance = Math.floor(cStats.endurance * 1.20); cStats.combat = Math.floor(cStats.combat * 0.90); cStats.intelligence = Math.floor(cStats.intelligence * 0.90); }
        else { prefix = '【狡詐的】'; cStats.luck += 15; cStats.intelligence = Math.floor(cStats.intelligence * 1.10); cStats.endurance = Math.floor(cStats.endurance * 0.85); }
        newNpcs.push({ ...baseMatch, id: `${baseMatch.id}-${Date.now()}`, name: `${prefix}${baseMatch.name}`, stats: cStats });
        return { arenaNPCs: newNpcs };
      });

    } else {
      newLosses++;
      newStamina = 0; 
      isInjuredNow = true; 
      logs.push({ round: round - 1, message: `［結算］${slave.name} 遭受重創倒地，體力耗盡並陷入【負傷】狀態！`, type: 'system', sHp, nHp });
    }

    set((s) => ({ player: { ...s.player, actionPoints: s.player.actionPoints - 1 } }));
    let newStress = slave.conditionStats.stress; let newRebellion = slave.conditionStats.rebellion;
    if (slave.race !== '不死族') {
      newStress = Math.min(100, newStress + (isWin ? 5 : 15)); newRebellion = Math.min(100, newRebellion + (isWin ? 2 : 10));
      if (slave.race === '人類' && isWin) newStress = Math.max(0, newStress - (round * 2));
      if (slave.race === '龍族' && newStamina < 30) newRebellion = Math.min(100, newRebellion + 20);
    }

    get().updateSlave(slave.id, { combatRecord: { wins: newWins, losses: newLosses }, isInjured: isInjuredNow, conditionStats: { stamina: newStamina, stress: newStress, rebellion: newRebellion }, primaryStats: slave.primaryStats });
    
    const playbackData: CombatPlaybackData = {
       slaveId: slave.id, slaveName: slave.name, slaveMaxHp: sHpMax,
       npcName: npc.name, npcMaxHp: nHpMax, logs, isWin,
       rewardGold: isWin ? npc.rewardGold : 0, rewardPrestige: isWin ? npc.rewardPrestige : 0, isAbyss: false
    };
    set({ activeCombat: playbackData });

    get().processTurn(); get().syncProfileToCloud(); return { logs, isWin };
  },

  executeAbyssBattle: (slaveId) => {
    const state = get(); const slave = state.slaves.find(s => s.id === slaveId);
    if (!slave || state.player.actionPoints < 1) return null;

    const floor = state.player.abyssFloor; const enemy = getAbyssEnemy(floor);
    const logs: CombatLog[] = [];

    let weaponAtk = 0; if (slave.equipment?.weaponId && ITEMS_DATA[slave.equipment.weaponId]) weaponAtk = ITEMS_DATA[slave.equipment.weaponId].effect.attack || 0;

    const combatStat = slave.isInjured ? Math.floor(slave.primaryStats.combat * 0.5) : slave.primaryStats.combat;
    const enduranceStat = slave.isInjured ? Math.floor(slave.primaryStats.endurance * 0.5) : slave.primaryStats.endurance;
    const intelligenceStat = slave.isInjured ? Math.floor(slave.primaryStats.intelligence * 0.5) : slave.primaryStats.intelligence;
    const combatSkill = slave.isInjured ? Math.floor((slave.skills?.combat || 1) * 0.5) : (slave.skills?.combat || 1);
    const survivalSkill = slave.isInjured ? Math.floor((slave.skills?.survival || 1) * 0.5) : (slave.skills?.survival || 1);
    const sLuck = slave.primaryStats.luck ?? 10;
    
    let sHpMax = Math.floor(enduranceStat * 5); let sHp = Math.floor(sHpMax * (slave.conditionStats.stamina / 100));
    let sAtk = combatStat + weaponAtk; let sDef = Math.floor(enduranceStat * 0.5 + survivalSkill * 2); let sSpd = intelligenceStat;
    let sDmgMulti = 1 + (combatSkill * 0.05); let sDmgReduc = combatSkill * 0.03;

    if (slave.race === '精靈') sSpd = Math.floor(sSpd * 1.2);
    if (slave.race === '半獸人') { sAtk = Math.floor(sAtk * 1.15); sDef = Math.floor(sDef * 0.9); }
    if (slave.race === '矮人') { sHpMax = Math.floor(sHpMax * 1.2); sHp = Math.floor(sHp * 1.2); sDef = Math.floor(sDef * 1.15); }
    if (slave.race === '龍族') { sAtk = Math.floor(sAtk * 1.1); sDef = Math.floor(sDef * 1.1); sSpd = Math.floor(sSpd * 1.1); sDmgReduc += 0.2; }

    let nHpMax = enemy.stats.endurance * 5; let nHp = nHpMax;
    let nAtk = enemy.stats.combat; let nDef = Math.floor(enemy.stats.endurance * 0.5); 
    let nSpd = enemy.stats.intelligence; let nLuck = enemy.stats.luck; let nCharisma = enemy.stats.charisma;

    logs.push({ round: 0, message: `［系統］${slave.name} 踏入深淵第 ${floor} 階，迎戰 ${enemy.name}。`, type: 'system', sHp, nHp });
    logs.push({ round: 0, message: `「${enemy.quote}」`, type: 'system', sHp, nHp });

    if (slave.race === '精靈') logs.push({ round: 0, message: `［風之眷顧］${slave.name} 身形如風奪得先手，首擊傷害大幅增幅！`, type: 'skill', sHp, nHp });
    if (slave.race === '半獸人') logs.push({ round: 0, message: `［狂熱戰血］${slave.name} 點燃了怒火，放棄防禦以換取更具破壞力的重擊！`, type: 'skill', sHp, nHp });
    if (slave.race === '矮人') logs.push({ round: 0, message: `［堅岩體魄］${slave.name} 展現了北地體格，肌肉宛如磐石般堅不可摧！`, type: 'skill', sHp, nHp });
    if (slave.race === '龍族') logs.push({ round: 0, message: `［真龍威壓］${slave.name} 釋放了上位威壓，全屬性增幅並獲得巨額減傷！`, type: 'skill', sHp, nHp });
    if (slave.race === '人類') logs.push({ round: 0, message: `［絕境意志］${slave.name} 懷抱求生潛能，瀕死狀態下攻擊力將大幅爆發。`, type: 'skill', sHp, nHp });
    if (slave.race === '不死族') logs.push({ round: 0, message: `［枯骨不朽］${slave.name} 散發著死氣，其攻擊能精準汲取敵人的生命力。`, type: 'skill', sHp, nHp });

    let round = 1; let orcStack = 0; let humanUnstoppable = false;

    while (sHp > 0 && nHp > 0 && round <= 50) {
      const isSlaveFirst = sSpd >= nSpd;
      const slaveAction = () => {
        if (sHp <= 0) return; let atkPower = sAtk; let dmgMulti = sDmgMulti;
        if (slave.race === '人類' && sHp < sHpMax * 0.4 && !humanUnstoppable) { humanUnstoppable = true; logs.push({ round, message: `［絕境意志］${slave.name} 爆發強烈的求生欲，攻擊力極大幅提升！`, type: 'skill', sHp, nHp }); }
        if (humanUnstoppable) atkPower = Math.floor(atkPower * 1.25);
        if (slave.race === '精靈' && isSlaveFirst) dmgMulti += 0.15;
        if (slave.race === '半獸人') dmgMulti += Math.min(0.3, orcStack * 0.03);

        const nDodgeRate = Math.min(0.20, (nLuck / 100) * 0.20);
        if (Math.random() < nDodgeRate) {
            logs.push({ round, message: `［閃避］${enemy.name} 看破了攻勢，完美閃避了 ${slave.name} 的攻擊！`, type: 'skill', sHp, nHp });
        } else {
            let dmg = Math.floor(Math.max(1, atkPower - nDef) * dmgMulti); 
            const sCritRate = Math.min(0.30, (sLuck / 100) * 0.30);
            if (Math.random() < sCritRate) {
                dmg = Math.floor(dmg * 1.5);
                logs.push({ round, message: `［爆擊］${slave.name} 抓住了轉瞬即逝的破綻，造成 1.5 倍爆擊傷害！`, type: 'damage', sHp, nHp });
            }
            nHp -= dmg; nHp = Math.max(0, nHp);
            logs.push({ round, message: `${slave.name} 發動攻擊，對 ${enemy.name} 造成 ${dmg} 點傷害。`, type: 'damage', sHp, nHp, damage: dmg });
            if (slave.race === '不死族') { const heal = Math.floor(dmg * 0.15); if (heal > 0) { sHp = Math.min(sHpMax, sHp + heal); logs.push({ round, message: `［枯骨不朽］${slave.name} 吸收了 ${heal} 點生命力。`, type: 'heal', sHp, nHp, damage: heal }); } }
        }
      };
      const npcAction = () => {
        if (nHp <= 0) return; 
        const sDodgeRate = Math.min(0.20, (sLuck / 100) * 0.20);
        if (Math.random() < sDodgeRate) {
            logs.push({ round, message: `［閃避］${slave.name} 靈巧地避開了 ${enemy.name} 的攻擊！`, type: 'skill', sHp, nHp });
        } else {
            let dmg = Math.max(1, nAtk - sDef); 
            if (slave.race === '矮人') { dmg = Math.max(1, dmg - 5); logs.push({ round, message: `［天賦防禦］${slave.name} 的【堅岩體魄】使其硬生生抵擋並折抵了 5 點致命傷害！`, type: 'skill', sHp, nHp }); }
            dmg = Math.floor(dmg * (1 - sDmgReduc)); 
            
            const nCritRate = Math.min(0.30, (nLuck / 100) * 0.30);
            if (Math.random() < nCritRate) {
                dmg = Math.floor(dmg * 1.5);
                logs.push({ round, message: `［爆擊］${enemy.name} 的攻勢異常兇猛，對 ${slave.name} 造成 1.5 倍爆擊傷害！`, type: 'damage', sHp, nHp });
            }
            sHp -= dmg; sHp = Math.max(0, sHp);
            logs.push({ round, message: `${enemy.name} 揮舞武器，對 ${slave.name} 造成 ${dmg} 點傷害.`, type: 'damage', sHp, nHp, damage: dmg });
            if (slave.race === '半獸人') { orcStack++; logs.push({ round, message: `［天賦層數］${slave.name} 承受攻擊，痛苦激發狂暴！`, type: 'skill', sHp, nHp }); }
        }
      };
      if (isSlaveFirst) { slaveAction(); npcAction(); } else { npcAction(); slaveAction(); }
      round++;
    }

    const isWin = sHp > 0;
    let newWins = slave.combatRecord?.wins || 0;
    let newLosses = slave.combatRecord?.losses || 0;
    let isInjuredNow = slave.isInjured || false;
    let newStamina = Math.max(0, slave.conditionStats.stamina - 30);

    if (isWin) {
      newWins++;
      logs.push({ round: round - 1, message: `［結算］${slave.name} 擊潰了深淵的阻礙，成功晉級！`, type: 'system', sHp, nHp });
      
      const charismaBonus = 1 + Math.floor(nCharisma / 10) * 0.05;
      const finalRewardGold = Math.floor(enemy.rewardGold * charismaBonus);
      get().addGold(finalRewardGold); 
      if (enemy.rewardPrestige > 0) get().addPrestige(enemy.rewardPrestige);
      
      set((s) => ({ player: { ...s.player, abyssFloor: s.player.abyssFloor + 1 } }));

      if (charismaBonus > 1) {
          logs.push({ round: round - 1, message: `［戰利品加成］擊破高魅力淵主，資金獲得額外加成，共計獲取 ${finalRewardGold}！`, type: 'system', sHp, nHp });
      }

      const netWins = newWins - newLosses;
      if (netWins > 0 && netWins % 5 === 0) {
        const pool = ['combat', 'endurance', 'intelligence', 'charisma', 'luck'] as const;
        const picked = pool[Math.floor(Math.random() * pool.length)];
        slave.primaryStats[picked] = Math.min(100, (slave.primaryStats[picked] ?? 10) + 1);
        const nameMap = { combat: '武力', endurance: '體質', intelligence: '智力', charisma: '魅力', luck: '幸運' };
        logs.push({ round: round - 1, message: `歷練突破！${slave.name} 累積淨勝場達 ${netWins} 場，【${nameMap[picked]}】永久提升 1 點！`, type: 'skill', sHp, nHp });
      }
    } else {
      newLosses++;
      newStamina = 0; 
      isInjuredNow = true; 
      logs.push({ round: round - 1, message: `［結算］${slave.name} 不支倒地，被深淵無情吞噬並陷入【負傷】狀態！`, type: 'system', sHp, nHp });
    }

    set((s) => ({ player: { ...s.player, actionPoints: s.player.actionPoints - 1 } }));
    let newStress = slave.conditionStats.stress; let newRebellion = slave.conditionStats.rebellion;
    if (slave.race !== '不死族') {
      newStress = Math.min(100, newStress + (isWin ? 10 : 25)); newRebellion = Math.min(100, newRebellion + (isWin ? 5 : 15));
      if (slave.race === '人類' && isWin) newStress = Math.max(0, newStress - (round * 2));
      if (slave.race === '龍族' && newStamina < 30) newRebellion = Math.min(100, newRebellion + 20);
    }

    get().updateSlave(slave.id, { combatRecord: { wins: newWins, losses: newLosses }, isInjured: isInjuredNow, conditionStats: { stamina: newStamina, stress: newStress, rebellion: newRebellion }, primaryStats: slave.primaryStats });
    
    const playbackData: CombatPlaybackData = {
       slaveId: slave.id, slaveName: slave.name, slaveMaxHp: sHpMax,
       npcName: enemy.name, npcMaxHp: nHpMax, logs, isWin,
       rewardGold: isWin ? enemy.rewardGold : 0, rewardPrestige: isWin ? enemy.rewardPrestige : 0, isAbyss: true
    };
    set({ activeCombat: playbackData });

    get().processTurn(); get().syncProfileToCloud(); return { logs, isWin };
  }
});
