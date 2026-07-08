import { StateCreator } from 'zustand';
import { GameStore } from '../../types/storeTypes';
import { CombatLog, CombatPlaybackData } from '../../types';
import { ITEMS_DATA } from '../../utils/gameData';
import { getAbyssEnemy, BASE_ARENA_NPCS } from '../../utils/generators';
import i18n from '../../i18n'; // ★ V2.10.0 引入 i18n 引擎以支援動態前綴與數值翻譯

export const createCombatSlice: StateCreator<GameStore, [], [], any> = (set, get) => ({
  executeArenaBattle: (slaveId: string, npcId: string) => {
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
    // ★ V2.10.0 日誌重構：使用 addLog 輔助函數隱式塞入 messageKey 與 params
    const addLog = (r: number, key: string, params: any, msg: string, type: 'system'|'damage'|'heal'|'skill', dmg?: number) => {
        logs.push({ round: r, messageKey: key, messageParams: params, message: msg, type, sHp, nHp, damage: dmg } as any);
    };

    addLog(0, 'log.arena_enter', { slave: slave.name, npc: npc.name }, `［系統］${slave.name} 踏入賽場，迎戰 ${npc.name}。`, 'system');

    if (slave.race === '精靈') addLog(0, 'log.skill_elf', { slave: slave.name }, `［風之眷顧］${slave.name} 身形如風奪得先手，首擊傷害大幅增幅！`, 'skill');
    if (slave.race === '半獸人') addLog(0, 'log.skill_orc', { slave: slave.name }, `［狂熱戰血］${slave.name} 點燃了怒火，放棄防禦以換取更具破壞力的重擊！`, 'skill');
    if (slave.race === '矮人') addLog(0, 'log.skill_dwarf', { slave: slave.name }, `［堅岩體魄］${slave.name} 展現了北地體格，肌肉宛如磐石般堅不可摧！`, 'skill');
    if (slave.race === '龍族') addLog(0, 'log.skill_dragon', { slave: slave.name }, `［真龍威壓］${slave.name} 釋放了上位威壓，全屬性增幅並獲得巨額減傷！`, 'skill');
    if (slave.race === '人類') addLog(0, 'log.skill_human', { slave: slave.name }, `［絕境意志］${slave.name} 懷抱求生潛能，瀕死狀態下攻擊力將大幅爆發。`, 'skill');
    if (slave.race === '不死族') addLog(0, 'log.skill_undead', { slave: slave.name }, `［枯骨不朽］${slave.name} 散發著死氣，其攻擊能精準汲取敵人的生命力。`, 'skill');

    let round = 1; let orcStack = 0; let humanUnstoppable = false;

    while (sHp > 0 && nHp > 0 && round <= 50) {
      const isSlaveFirst = sSpd >= nSpd;
      const slaveAction = () => {
        if (sHp <= 0) return; let atkPower = sAtk; let dmgMulti = sDmgMulti;
        if (slave.race === '人類' && sHp < sHpMax * 0.4 && !humanUnstoppable) { 
            humanUnstoppable = true; 
            addLog(round, 'log.human_unstoppable', { slave: slave.name }, `［絕境意志］${slave.name} 爆發強烈的求生欲，攻擊力極大幅提升！`, 'skill'); 
        }
        if (humanUnstoppable) atkPower = Math.floor(atkPower * 1.25);
        if (slave.race === '精靈' && isSlaveFirst) dmgMulti += 0.15;
        if (slave.race === '半獸人') dmgMulti += Math.min(0.3, orcStack * 0.03);

        const nDodgeRate = Math.min(0.20, (nLuck / 100) * 0.20);
        if (Math.random() < nDodgeRate) {
            addLog(round, 'log.npc_dodge', { npc: npc.name, slave: slave.name }, `［閃避］${npc.name} 驚險地避開了 ${slave.name} 的致命一擊！`, 'skill');
        } else {
            let dmg = Math.floor(Math.max(1, atkPower - nDef) * dmgMulti); 
            const sCritRate = Math.min(0.30, (sLuck / 100) * 0.30);
            if (Math.random() < sCritRate) {
                dmg = Math.floor(dmg * 1.5);
                addLog(round, 'log.slave_crit', { slave: slave.name }, `［爆擊］${slave.name} 抓住了轉瞬即逝的破綻，造成 1.5 倍爆擊傷害！`, 'damage');
            }
            nHp -= dmg; nHp = Math.max(0, nHp);
            addLog(round, 'log.slave_atk', { slave: slave.name, npc: npc.name, dmg }, `${slave.name} 發動攻擊，對 ${npc.name} 造成 ${dmg} 點傷害。`, 'damage', dmg);
            if (slave.race === '不死族') { 
                const heal = Math.floor(dmg * 0.15); 
                if (heal > 0) { 
                    sHp = Math.min(sHpMax, sHp + heal); 
                    addLog(round, 'log.undead_heal', { slave: slave.name, heal }, `［枯骨不朽］${slave.name} 吸收了 ${heal} 點生命力。`, 'heal', heal); 
                } 
            }
        }
      };
      const npcAction = () => {
        if (nHp <= 0) return; 
        const sDodgeRate = Math.min(0.20, (sLuck / 100) * 0.20);
        if (Math.random() < sDodgeRate) {
            addLog(round, 'log.slave_dodge', { slave: slave.name, npc: npc.name }, `［閃避］${slave.name} 靈巧地避開了 ${npc.name} 的攻擊！`, 'skill');
        } else {
            let dmg = Math.max(1, nAtk - sDef); 
            if (slave.race === '矮人') { 
                dmg = Math.max(1, dmg - 5); 
                addLog(round, 'log.dwarf_defend', { slave: slave.name }, `［天賦防禦］${slave.name} 的【堅岩體魄】使其硬生生抵擋並折抵了 5 點致命傷害！`, 'skill'); 
            }
            dmg = Math.floor(dmg * (1 - sDmgReduc)); 
            
            const nCritRate = Math.min(0.30, (nLuck / 100) * 0.30);
            if (Math.random() < nCritRate) {
                dmg = Math.floor(dmg * 1.5);
                addLog(round, 'log.npc_crit', { npc: npc.name, slave: slave.name }, `［爆擊］${npc.name} 的攻勢異常兇猛，對 ${slave.name} 造成 1.5 倍爆擊傷害！`, 'damage');
            }
            sHp -= dmg; sHp = Math.max(0, sHp);
            addLog(round, 'log.npc_atk', { npc: npc.name, slave: slave.name, dmg }, `${npc.name} 揮舞武器，對 ${slave.name} 造成 ${dmg} 點傷害。`, 'damage', dmg);
            if (slave.race === '半獸人') { 
                orcStack++; 
                addLog(round, 'log.orc_stack', { slave: slave.name }, `［天賦層數］${slave.name} 承受攻擊，痛苦激發狂暴！`, 'skill'); 
            }
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

    let finalRewardGold = 0;

    if (isWin) {
      newWins++;
      addLog(round - 1, 'log.arena_win', { slave: slave.name }, `［結算］${slave.name} 屹立到了最後，取得勝利。`, 'system');
      
      const charismaBonus = 1 + Math.floor(nCharisma / 10) * 0.05;
      finalRewardGold = Math.floor(npc.rewardGold * charismaBonus);
      get().addGold(finalRewardGold); 
      if (npc.rewardPrestige > 0) get().addPrestige(npc.rewardPrestige);
      
      const foodReward = Math.floor(Math.random() * 11) + 5;
      get().addFood(foodReward);
      addLog(round - 1, 'log.food_reward', { foodReward }, `［戰利品附加］在對手身上搜刮到口糧 ${foodReward} 單位。`, 'system');

      if (charismaBonus > 1) {
          addLog(round - 1, 'log.charisma_bonus', { finalRewardGold }, `［戰利品加成］擊敗高魅力對手，資金獲得額外加成，共計獲取 ${finalRewardGold}！`, 'system');
      }

      const netWins = newWins - newLosses;
      if (netWins > 0 && netWins % 5 === 0) {
        const pool = ['combat', 'endurance', 'intelligence', 'charisma', 'luck'] as const;
        const picked = pool[Math.floor(Math.random() * pool.length)];
        slave.primaryStats[picked] = Math.min(100, (slave.primaryStats[picked] ?? 10) + 1);
        
        const nameMap: Record<string, string> = { 
            combat: i18n.t('stats.combat', '武力'), endurance: i18n.t('stats.endurance', '體質'), 
            intelligence: i18n.t('stats.intelligence', '智力'), charisma: i18n.t('stats.charisma', '魅力'), luck: i18n.t('stats.luck', '幸運') 
        };
        addLog(round - 1, 'log.stat_up', { slave: slave.name, netWins, stat: nameMap[picked] }, `歷練突破！${slave.name} 累積淨勝場達 ${netWins} 場，【${nameMap[picked]}】永久提升 1 點！`, 'skill');
      }
      
      set((s: GameStore) => {
        const newNpcs = s.arenaNPCs.filter(n => n.id !== npcId);
        const baseMatch = BASE_ARENA_NPCS.find(b => b.location === npc.location) || BASE_ARENA_NPCS[0];
        const rand = Math.random();
        let prefix = ''; let cStats = { ...baseMatch.stats };
        // ★ V2.10.0 即時翻譯敵方前綴
        if (rand < 0.33) { prefix = i18n.t('npc.prefix_berserk', '【狂暴的】 '); cStats.combat = Math.floor(cStats.combat * 1.15); cStats.endurance = Math.floor(cStats.endurance * 0.85); }
        else if (rand < 0.66) { prefix = i18n.t('npc.prefix_iron', '【鐵壁的】 '); cStats.endurance = Math.floor(cStats.endurance * 1.20); cStats.combat = Math.floor(cStats.combat * 0.90); cStats.intelligence = Math.floor(cStats.intelligence * 0.90); }
        else { prefix = i18n.t('npc.prefix_cunning', '【狡詐的】 '); cStats.luck += 15; cStats.intelligence = Math.floor(cStats.intelligence * 1.10); cStats.endurance = Math.floor(cStats.endurance * 0.85); }
        newNpcs.push({ ...baseMatch, id: `${baseMatch.id}-${Date.now()}`, name: `${prefix}${baseMatch.name}`, stats: cStats });
        return { arenaNPCs: newNpcs };
      });

    } else {
      newLosses++;
      newStamina = 0; 
      isInjuredNow = true; 
      addLog(round - 1, 'log.arena_lose', { slave: slave.name }, `［結算］${slave.name} 遭受重創倒地，體力耗盡並陷入【負傷】狀態！`, 'system');
    }

    set((s: GameStore) => ({ player: { ...s.player, actionPoints: s.player.actionPoints - 1 } }));
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
       rewardGold: finalRewardGold,
       rewardPrestige: isWin ? npc.rewardPrestige : 0, isAbyss: false
    };
    set({ activeCombat: playbackData });

    get().processTurn(); get().syncProfileToCloud(); return { logs, isWin };
  },

  executeAbyssBattle: (slaveId: string) => {
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

    const addLog = (r: number, key: string, params: any, msg: string, type: 'system'|'damage'|'heal'|'skill', dmg?: number) => {
        logs.push({ round: r, messageKey: key, messageParams: params, message: msg, type, sHp, nHp, damage: dmg } as any);
    };

    addLog(0, 'log.abyss_enter', { slave: slave.name, floor, enemy: enemy.name }, `［系統］${slave.name} 踏入深淵第 ${floor} 階，迎戰 ${enemy.name}。`, 'system');
    addLog(0, 'log.abyss_quote', { quote: enemy.quote }, `「${enemy.quote}」`, 'system');

    if (slave.race === '精靈') addLog(0, 'log.skill_elf', { slave: slave.name }, `［風之眷顧］${slave.name} 身形如風奪得先手，首擊傷害大幅增幅！`, 'skill');
    if (slave.race === '半獸人') addLog(0, 'log.skill_orc', { slave: slave.name }, `［狂熱戰血］${slave.name} 點燃了怒火，放棄防禦以換取更具破壞力的重擊！`, 'skill');
    if (slave.race === '矮人') addLog(0, 'log.skill_dwarf', { slave: slave.name }, `［堅岩體魄］${slave.name} 展現了北地體格，肌肉宛如磐石般堅不可摧！`, 'skill');
    if (slave.race === '龍族') addLog(0, 'log.skill_dragon', { slave: slave.name }, `［真龍威壓］${slave.name} 釋放了上位威壓，全屬性增幅並獲得巨額減傷！`, 'skill');
    if (slave.race === '人類') addLog(0, 'log.skill_human', { slave: slave.name }, `［絕境意志］${slave.name} 懷抱求生潛能，瀕死狀態下攻擊力將大幅爆發。`, 'skill');
    if (slave.race === '不死族') addLog(0, 'log.skill_undead', { slave: slave.name }, `［枯骨不朽］${slave.name} 散發著死氣，其攻擊能精準汲取敵人的生命力。`, 'skill');

    let round = 1; let orcStack = 0; let humanUnstoppable = false;

    while (sHp > 0 && nHp > 0 && round <= 50) {
      const isSlaveFirst = sSpd >= nSpd;
      const slaveAction = () => {
        if (sHp <= 0) return; let atkPower = sAtk; let dmgMulti = sDmgMulti;
        if (slave.race === '人類' && sHp < sHpMax * 0.4 && !humanUnstoppable) { 
            humanUnstoppable = true; 
            addLog(round, 'log.human_unstoppable', { slave: slave.name }, `［絕境意志］${slave.name} 爆發強烈的求生欲，攻擊力極大幅提升！`, 'skill'); 
        }
        if (humanUnstoppable) atkPower = Math.floor(atkPower * 1.25);
        if (slave.race === '精靈' && isSlaveFirst) dmgMulti += 0.15;
        if (slave.race === '半獸人') dmgMulti += Math.min(0.3, orcStack * 0.03);

        const nDodgeRate = Math.min(0.20, (nLuck / 100) * 0.20);
        if (Math.random() < nDodgeRate) {
            addLog(round, 'log.npc_dodge', { npc: enemy.name, slave: slave.name }, `［閃避］${enemy.name} 看破了攻勢，完美閃避了 ${slave.name} 的攻擊！`, 'skill');
        } else {
            let dmg = Math.floor(Math.max(1, atkPower - nDef) * dmgMulti); 
            const sCritRate = Math.min(0.30, (sLuck / 100) * 0.30);
            if (Math.random() < sCritRate) {
                dmg = Math.floor(dmg * 1.5);
                addLog(round, 'log.slave_crit', { slave: slave.name }, `［爆擊］${slave.name} 抓住了轉瞬即逝的破綻，造成 1.5 倍爆擊傷害！`, 'damage');
            }
            nHp -= dmg; nHp = Math.max(0, nHp);
            addLog(round, 'log.slave_atk', { slave: slave.name, npc: enemy.name, dmg }, `${slave.name} 發動攻擊，對 ${enemy.name} 造成 ${dmg} 點傷害。`, 'damage', dmg);
            if (slave.race === '不死族') { 
                const heal = Math.floor(dmg * 0.15); 
                if (heal > 0) { 
                    sHp = Math.min(sHpMax, sHp + heal); 
                    addLog(round, 'log.undead_heal', { slave: slave.name, heal }, `［枯骨不朽］${slave.name} 吸收了 ${heal} 點生命力。`, 'heal', heal); 
                } 
            }
        }
      };
      const npcAction = () => {
        if (nHp <= 0) return; 
        const sDodgeRate = Math.min(0.20, (sLuck / 100) * 0.20);
        if (Math.random() < sDodgeRate) {
            addLog(round, 'log.slave_dodge', { slave: slave.name, npc: enemy.name }, `［閃避］${slave.name} 靈巧地避開了 ${enemy.name} 的攻擊！`, 'skill');
        } else {
            let dmg = Math.max(1, nAtk - sDef); 
            if (slave.race === '矮人') { 
                dmg = Math.max(1, dmg - 5); 
                addLog(round, 'log.dwarf_defend', { slave: slave.name }, `［天賦防禦］${slave.name} 的【堅岩體魄】使其硬生生抵擋並折抵了 5 點致命傷害！`, 'skill'); 
            }
            dmg = Math.floor(dmg * (1 - sDmgReduc)); 
            
            const nCritRate = Math.min(0.30, (nLuck / 100) * 0.30);
            if (Math.random() < nCritRate) {
                dmg = Math.floor(dmg * 1.5);
                addLog(round, 'log.npc_crit', { npc: enemy.name, slave: slave.name }, `［爆擊］${enemy.name} 的攻勢異常兇猛，對 ${slave.name} 造成 1.5 倍爆擊傷害！`, 'damage');
            }
            sHp -= dmg; sHp = Math.max(0, sHp);
            addLog(round, 'log.npc_atk', { npc: enemy.name, slave: slave.name, dmg }, `${enemy.name} 揮舞武器，對 ${slave.name} 造成 ${dmg} 點傷害.`, 'damage', dmg);
            if (slave.race === '半獸人') { 
                orcStack++; 
                addLog(round, 'log.orc_stack', { slave: slave.name }, `［天賦層數］${slave.name} 承受攻擊，痛苦激發狂暴！`, 'skill'); 
            }
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

    let finalRewardGold = 0;

    if (isWin) {
      newWins++;
      addLog(round - 1, 'log.abyss_win', { slave: slave.name }, `［結算］${slave.name} 擊潰了深淵的阻礙，成功晉級！`, 'system');
      
      const charismaBonus = 1 + Math.floor(nCharisma / 10) * 0.05;
      finalRewardGold = Math.floor(enemy.rewardGold * charismaBonus);
      get().addGold(finalRewardGold); 
      if (enemy.rewardPrestige > 0) get().addPrestige(enemy.rewardPrestige);
      
      set((s: GameStore) => ({ player: { ...s.player, abyssFloor: s.player.abyssFloor + 1 } }));

      if (charismaBonus > 1) {
          addLog(round - 1, 'log.abyss_charisma_bonus', { finalRewardGold }, `［戰利品加成］擊破高魅力淵主，資金獲得額外加成，共計獲取 ${finalRewardGold}！`, 'system');
      }

      const netWins = newWins - newLosses;
      if (netWins > 0 && netWins % 5 === 0) {
        const pool = ['combat', 'endurance', 'intelligence', 'charisma', 'luck'] as const;
        const picked = pool[Math.floor(Math.random() * pool.length)];
        slave.primaryStats[picked] = Math.min(100, (slave.primaryStats[picked] ?? 10) + 1);
        
        const nameMap: Record<string, string> = { 
            combat: i18n.t('stats.combat', '武力'), endurance: i18n.t('stats.endurance', '體質'), 
            intelligence: i18n.t('stats.intelligence', '智力'), charisma: i18n.t('stats.charisma', '魅力'), luck: i18n.t('stats.luck', '幸運') 
        };
        addLog(round - 1, 'log.stat_up', { slave: slave.name, netWins, stat: nameMap[picked] }, `歷練突破！${slave.name} 累積淨勝場達 ${netWins} 場，【${nameMap[picked]}】永久提升 1 點！`, 'skill');
      }
    } else {
      newLosses++;
      newStamina = 0; 
      isInjuredNow = true; 
      addLog(round - 1, 'log.abyss_lose', { slave: slave.name }, `［結算］${slave.name} 不支倒地，被深淵無情吞噬並陷入【負傷】狀態！`, 'system');
    }

    set((s: GameStore) => ({ player: { ...s.player, actionPoints: s.player.actionPoints - 1 } }));
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
       rewardGold: finalRewardGold,
       rewardPrestige: isWin ? enemy.rewardPrestige : 0, isAbyss: true
    };
    set({ activeCombat: playbackData });

    get().processTurn(); get().syncProfileToCloud(); return { logs, isWin };
  }
});
