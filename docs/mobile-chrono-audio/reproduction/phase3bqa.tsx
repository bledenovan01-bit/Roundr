// Isolated QA route; never included in production sources or exports.
import {useEffect,useState} from 'react';import {AccessibilityInfo,View,Text} from 'react-native';import {useLocalSearchParams} from 'expo-router';
import cases from '../phase3b-cases.json';import {loadStore,startSession,dispatchSession,flushStorage} from '@/src/store/session-store';import {LovableTournamentFlow} from '@/src/features/lovable-tournament';import type {Session} from '@/src/domain/types';
AccessibilityInfo.isReduceMotionEnabled=async()=>true;
export default function QA(){const {scenario}=useLocalSearchParams();const [ready,setReady]=useState(false);
 useEffect(()=>{let cancelled=false;const spec=cases.find(c=>c.id===scenario);if(!spec)return;void(async()=>{Date.now=()=>spec.now;await loadStore();const s=spec.native as Session;startSession(s);dispatchSession(()=>s,{silent:true});await flushStorage();if(!cancelled)setReady(true);})();return()=>{cancelled=true;};},[scenario]);
 return ready?<LovableTournamentFlow/>:<View><Text>Préparation de l’état de test…</Text></View>;
}
