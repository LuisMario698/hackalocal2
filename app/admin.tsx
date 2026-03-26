import React, { useState } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import Text from '../components/ScaledText';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';

// ─── Types ────────────────────────────────────────────────────
interface Citizen { id: string; name: string; email: string; }
interface CitizenReport {
  id: string; citizenId: string; citizenName: string;
  title: string; category: string; description: string;
  date: string; hasEvidence: boolean; registeredBy: 'self' | 'institution';
}
interface HelpAction {
  id: string; citizenId: string; citizenName: string;
  reportId: string; reportTitle: string; description: string;
  date: string; hasEvidence: boolean; registeredBy: 'self' | 'institution';
}

// ─── Seed Data ────────────────────────────────────────────────
const CITIZENS: Citizen[] = [
  { id: 'c1', name: 'María López',    email: 'maria@email.com' },
  { id: 'c2', name: 'Carlos Mendoza', email: 'carlos@email.com' },
  { id: 'c3', name: 'Ana Rodríguez',  email: 'ana@email.com' },
  { id: 'c4', name: 'Esteban García', email: 'esteban@email.com' },
  { id: 'c5', name: 'Sofía Martínez', email: 'sofia@email.com' },
];
const SEED_REPORTS: CitizenReport[] = [
  { id:'rp1', citizenId:'c1', citizenName:'María López',    title:'Basura en la playa principal',         category:'Basura',        description:'Botellas y plásticos en la orilla.',  date:'2026-03-20', hasEvidence:true,  registeredBy:'self' },
  { id:'rp2', citizenId:'c2', citizenName:'Carlos Mendoza', title:'Basura acumulada en parque',            category:'Basura',        description:'Llevan 3 días sin recoger.',          date:'2026-03-22', hasEvidence:false, registeredBy:'self' },
  { id:'rp3', citizenId:'c3', citizenName:'Ana Rodríguez',  title:'Drenaje desbordado en Col. Esperanza', category:'Agua',          description:'El drenaje lleva desbordado.',       date:'2026-03-23', hasEvidence:true,  registeredBy:'institution' },
  { id:'rp4', citizenId:'c1', citizenName:'María López',    title:'Fauna herida cerca del malecón',       category:'Fauna',         description:'Pelícano con ala rota.',             date:'2026-03-24', hasEvidence:true,  registeredBy:'self' },
  { id:'rp5', citizenId:'c4', citizenName:'Esteban García', title:'Electrónicos abandonados',             category:'Electrónicos',  description:'TV y refrigerador abandonados.',     date:'2026-03-18', hasEvidence:false, registeredBy:'institution' },
];
const SEED_ACTIONS: HelpAction[] = [
  { id:'ha1', citizenId:'c1', citizenName:'María López',    reportId:'rp2', reportTitle:'Basura en parque',   description:'Organizó limpieza con voluntarios.', date:'2026-03-23', hasEvidence:true,  registeredBy:'self' },
  { id:'ha2', citizenId:'c2', citizenName:'Carlos Mendoza', reportId:'rp1', reportTitle:'Basura en la playa', description:'Recogió basura con bolsas y guantes.',date:'2026-03-21', hasEvidence:false, registeredBy:'self' },
  { id:'ha3', citizenId:'c3', citizenName:'Ana Rodríguez',  reportId:'rp3', reportTitle:'Drenaje desbordado',  description:'Coordinó cuadrilla municipal.',       date:'2026-03-24', hasEvidence:true,  registeredBy:'institution' },
  { id:'ha4', citizenId:'c5', citizenName:'Sofía Martínez', reportId:'rp4', reportTitle:'Fauna herida',        description:'Llevó animal a veterinario.',         date:'2026-03-25', hasEvidence:true,  registeredBy:'institution' },
];

const CATEGORIES = ['Basura','Agua','Fauna','Electrónicos','Orgánico','Otro'];
const CAT_COLORS: Record<string,string> = {
  Basura: Colors.category.trash, Agua: Colors.category.drain,
  Fauna: Colors.category.wildlife, Electrónicos: Colors.category.electronic,
  Orgánico: Colors.category.organic, Otro: Colors.category.other,
};
const SIDEBAR_W = 240;

// Nav order: Registrar first
type Section = 'registrar'|'ciudadanos'|'reportes'|'acciones';
const NAV: { id:Section; label:string; icon:string; color:string }[] = [
  { id:'registrar',  label:'Registrar',          icon:'add-circle',      color:Colors.primary },
  { id:'ciudadanos', label:'Ciudadanos',          icon:'people',          color:'#3B82F6' },
  { id:'reportes',   label:'Reportes',            icon:'alert-circle',    color:Colors.accent },
  { id:'acciones',   label:'Acciones de Ayuda',  icon:'hand-right',      color:'#8B5CF6' },
];

// ─── Atoms ────────────────────────────────────────────────────
function Pill({ label, color, bg }: { label:string; color:string; bg:string }) {
  return (
    <View style={{ backgroundColor:bg, paddingHorizontal:10, paddingVertical:4, borderRadius:20 }}>
      <Text style={{ fontSize:12, fontWeight:'700', color }}>{label}</Text>
    </View>
  );
}
function EvidencePill({ has }:{ has:boolean }) {
  return <Pill label={has?'✓ Con evidencia':'✗ Sin evidencia'} color={has?Colors.primary:Colors.textMuted} bg={has?Colors.primaryLight:Colors.borderLight} />;
}
function RegPill({ by }:{ by:'self'|'institution' }) {
  return <Pill label={by==='institution'?'🏛 Institución':'📱 Móvil'} color={by==='institution'?'#7C3AED':'#1D4ED8'} bg={by==='institution'?'#EDE9FE':'#DBEAFE'} />;
}

// ─── Field components ─────────────────────────────────────────
function FieldLabel({ children }: { children:string }) {
  return <Text style={fi.label}>{children}</Text>;
}
function StyledInput({ value, onChangeText, placeholder, multiline, h }: { value:string; onChangeText:(t:string)=>void; placeholder:string; multiline?:boolean; h?:number }) {
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      style={[fi.input, multiline && { height: h||100, textAlignVertical:'top', paddingTop:14 }, focused && fi.inputFocused]}
      value={value} onChangeText={onChangeText} placeholder={placeholder}
      placeholderTextColor={Colors.textMuted} multiline={multiline}
      onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
    />
  );
}
const fi = StyleSheet.create({
  label:{ fontSize:14, fontWeight:'700', color:Colors.text, marginBottom:8 },
  input:{ backgroundColor:Colors.surface, borderWidth:1.5, borderColor:Colors.border, borderRadius:16, paddingHorizontal:18, height:56, fontSize:15, color:Colors.text },
  inputFocused:{ borderColor:Colors.primary, backgroundColor:'#FAFFFE', shadowColor:Colors.primary, shadowOpacity:.15, shadowRadius:6, shadowOffset:{width:0,height:0}, elevation:2 },
});

// ─── Citizen selector chips ───────────────────────────────────
function CitizenSelector({ citizens, value, onChange }: { citizens:Citizen[]; value:string; onChange:(id:string)=>void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop:4 }}>
      <View style={{ flexDirection:'row', gap:10 }}>
        {citizens.map(c => {
          const sel = value === c.id;
          return (
            <TouchableOpacity key={c.id} style={[csel.chip, sel && { backgroundColor:Colors.primary, borderColor:Colors.primary }]} onPress={()=>onChange(c.id)}>
              <View style={[csel.avatar, sel && { backgroundColor:'rgba(255,255,255,0.3)' }]}>
                <Text style={[csel.avatarTxt, sel && { color:'#fff' }]}>{c.name.charAt(0)}</Text>
              </View>
              <Text style={[csel.name, sel && { color:'#fff' }]}>{c.name}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}
const csel = StyleSheet.create({
  chip:{ flexDirection:'row', alignItems:'center', gap:8, paddingRight:16, paddingLeft:6, paddingVertical:8, borderRadius:28, borderWidth:1.5, borderColor:Colors.border, backgroundColor:Colors.surface },
  avatar:{ width:32, height:32, borderRadius:16, backgroundColor:Colors.primaryLight, alignItems:'center', justifyContent:'center' },
  avatarTxt:{ fontSize:14, fontWeight:'800', color:Colors.primary },
  name:{ fontSize:14, fontWeight:'600', color:Colors.text },
});

// ─── Category selector ────────────────────────────────────────
function CategorySelector({ value, onChange }: { value:string; onChange:(c:string)=>void }) {
  return (
    <View style={{ flexDirection:'row', flexWrap:'wrap', gap:10, marginTop:4 }}>
      {CATEGORIES.map(cat => {
        const sel = value===cat;
        const catColor = CAT_COLORS[cat]||Colors.category.other;
        return (
          <TouchableOpacity key={cat} style={[catsel.chip, sel && { backgroundColor:catColor, borderColor:catColor }]} onPress={()=>onChange(cat)}>
            <View style={[catsel.dot, { backgroundColor: sel ? 'rgba(255,255,255,0.7)' : catColor }]} />
            <Text style={[catsel.txt, sel && { color:'#fff' }]}>{cat}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
const catsel = StyleSheet.create({
  chip:{ flexDirection:'row', alignItems:'center', gap:8, paddingHorizontal:16, paddingVertical:10, borderRadius:24, borderWidth:1.5, borderColor:Colors.border, backgroundColor:Colors.surface },
  dot:{ width:10, height:10, borderRadius:5 },
  txt:{ fontSize:14, fontWeight:'600', color:Colors.text },
});

// ─── Evidence toggle ──────────────────────────────────────────
function EvidenceToggle({ value, onChange }: { value:boolean; onChange:(v:boolean)=>void }) {
  return (
    <TouchableOpacity
      style={[ev.row, value && { borderColor:Colors.primary, backgroundColor:Colors.primaryLight }]}
      onPress={()=>onChange(!value)}
    >
      <View style={[ev.checkbox, value && { backgroundColor:Colors.primary, borderColor:Colors.primary }]}>
        {value && <Ionicons name="checkmark" size={16} color="#fff" />}
      </View>
      <View style={{ flex:1 }}>
        <Text style={{ fontSize:16, fontWeight:'700', color:Colors.text }}>Evidencia física entregada</Text>
        <Text style={{ fontSize:13, color:Colors.textMuted, marginTop:3, lineHeight:18 }}>
          Foto, video u otro documento presentado físicamente por el ciudadano al registrar
        </Text>
      </View>
      <View style={[ev.indicator, value && { backgroundColor:Colors.primary }]}>
        <Ionicons name={value ? 'checkmark-circle' : 'ellipse-outline'} size={28} color={value ? '#fff' : Colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
}
const ev = StyleSheet.create({
  row:{ flexDirection:'row', alignItems:'center', gap:16, borderWidth:1.5, borderColor:Colors.border, borderRadius:20, padding:18 },
  checkbox:{ width:28, height:28, borderRadius:9, borderWidth:2, borderColor:Colors.border, alignItems:'center', justifyContent:'center' },
  indicator:{ width:44, height:44, borderRadius:22, backgroundColor:Colors.borderLight, alignItems:'center', justifyContent:'center' },
});

// ─── Report selector ──────────────────────────────────────────
function ReportSelector({ reports, value, onChange }: { reports:CitizenReport[]; value:string; onChange:(id:string)=>void }) {
  return (
    <View style={{ gap:10, marginTop:4 }}>
      {reports.map(r => {
        const sel = value===r.id;
        const color = CAT_COLORS[r.category]||Colors.category.other;
        return (
          <TouchableOpacity key={r.id} style={[repsel.item, sel && { borderColor:Colors.primary, backgroundColor:Colors.primaryLight }]} onPress={()=>onChange(r.id)}>
            <View style={[repsel.dot, { backgroundColor:color }]} />
            <View style={{ flex:1 }}>
              <Text style={[repsel.title, sel && { color:Colors.primary }]} numberOfLines={1}>{r.title}</Text>
              <Text style={repsel.sub}>{r.category} · {r.date} · {r.citizenName}</Text>
            </View>
            {sel && <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
const repsel = StyleSheet.create({
  item:{ flexDirection:'row', alignItems:'center', gap:12, borderWidth:1.5, borderColor:Colors.border, borderRadius:16, padding:14, backgroundColor:Colors.surface },
  dot:{ width:12, height:12, borderRadius:6, flexShrink:0 },
  title:{ fontSize:15, fontWeight:'700', color:Colors.text },
  sub:{ fontSize:12, color:Colors.textMuted, marginTop:2 },
});

// ─── Inline Register Form ─────────────────────────────────────
type RegType = 'report'|'action';

function InlineRegisterForm({ type, citizens, reports, onSave, onDone }: {
  type: RegType; citizens:Citizen[]; reports:CitizenReport[];
  onSave:(d:any)=>void; onDone:()=>void;
}) {
  const [cId, setCId]     = useState('');
  const [title, setTitle] = useState('');
  const [desc, setDesc]   = useState('');
  const [cat, setCat]     = useState('');
  const [repId, setRepId] = useState('');
  const [hasEv, setHasEv] = useState(false);
  const [saved, setSaved] = useState(false);

  const isReport = type==='report';
  const color = isReport ? Colors.accent : '#8B5CF6';
  const colorBg = isReport ? Colors.accentLight : '#EDE9FE';
  const icon = isReport ? 'alert-circle' : 'hand-right';
  const valid = cId && desc && (isReport ? title && cat : repId);

  const handleSave = () => {
    if (!valid) return;
    const citizen = citizens.find(c=>c.id===cId)!;
    const today = new Date().toISOString().slice(0,10);
    if (isReport) {
      onSave({ citizenId:cId, citizenName:citizen.name, title, category:cat, description:desc, date:today, hasEvidence:hasEv, registeredBy:'institution' });
    } else {
      const rep = reports.find(r=>r.id===repId)!;
      onSave({ citizenId:cId, citizenName:citizen.name, reportId:repId, reportTitle:rep.title, description:desc, date:today, hasEvidence:hasEv, registeredBy:'institution' });
    }
    setSaved(true);
  };

  if (saved) {
    return (
      <View style={irf.successBox}>
        <View style={irf.successIcon}><Ionicons name="checkmark-circle" size={56} color={Colors.primary} /></View>
        <Text style={irf.successTitle}>¡Registro guardado!</Text>
        <Text style={irf.successSub}>El {isReport?'reporte':'acción de ayuda'} fue registrado exitosamente a nombre de {citizens.find(c=>c.id===cId)?.name}.</Text>
        <View style={{ flexDirection:'row', gap:12, marginTop:24 }}>
          <TouchableOpacity style={irf.successBtn} onPress={()=>{ setCId('');setTitle('');setDesc('');setCat('');setRepId('');setHasEv(false);setSaved(false); }}>
            <Ionicons name="add" size={18} color={Colors.primary} />
            <Text style={{ fontSize:15, fontWeight:'700', color:Colors.primary }}>Registrar otro</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[irf.successBtn, { backgroundColor:Colors.primary, borderColor:Colors.primary }]} onPress={onDone}>
            <Text style={{ fontSize:15, fontWeight:'700', color:'#fff' }}>Volver al inicio</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom:60 }}>
      {/* form header */}
      <View style={[irf.formHeader, { borderLeftColor:color }]}>
        <View style={[irf.formHeaderIcon, { backgroundColor:colorBg }]}>
          <Ionicons name={icon as any} size={26} color={color} />
        </View>
        <View style={{ flex:1 }}>
          <Text style={irf.formHeaderTitle}>{isReport?'Registrar Reporte':'Registrar Acción de Ayuda'}</Text>
          <Text style={irf.formHeaderSub}>{isReport?'Ciudadano reporta un problema ambiental con evidencia':'Ciudadano atendió y solucionó un reporte existente'}</Text>
        </View>
        <TouchableOpacity style={irf.closeBtn} onPress={onDone}>
          <Ionicons name="close" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={irf.form}>
        {/* Step 1 - Ciudadano */}
        <View style={irf.step}>
          <View style={[irf.stepNum, { backgroundColor:cId?Colors.primary:Colors.borderLight }]}>
            {cId ? <Ionicons name="checkmark" size={16} color="#fff" /> : <Text style={irf.stepNumTxt}>1</Text>}
          </View>
          <View style={{ flex:1 }}>
            <FieldLabel>Ciudadano que acude</FieldLabel>
            <CitizenSelector citizens={citizens} value={cId} onChange={setCId} />
          </View>
        </View>

        {isReport && (
          <>
            {/* Step 2 - Título */}
            <View style={irf.step}>
              <View style={[irf.stepNum, { backgroundColor:title?Colors.primary:Colors.borderLight }]}>
                {title ? <Ionicons name="checkmark" size={16} color="#fff" /> : <Text style={irf.stepNumTxt}>2</Text>}
              </View>
              <View style={{ flex:1 }}>
                <FieldLabel>Título del reporte</FieldLabel>
                <StyledInput value={title} onChangeText={setTitle} placeholder="Ej: Basura acumulada en la esquina de Calle 5ta y Av. Principal" />
              </View>
            </View>

            {/* Step 3 - Categoría */}
            <View style={irf.step}>
              <View style={[irf.stepNum, { backgroundColor:cat?Colors.primary:Colors.borderLight }]}>
                {cat ? <Ionicons name="checkmark" size={16} color="#fff" /> : <Text style={irf.stepNumTxt}>3</Text>}
              </View>
              <View style={{ flex:1 }}>
                <FieldLabel>Categoría del problema</FieldLabel>
                <CategorySelector value={cat} onChange={setCat} />
              </View>
            </View>

            {/* Step 4 - Descripción */}
            <View style={irf.step}>
              <View style={[irf.stepNum, { backgroundColor:desc?Colors.primary:Colors.borderLight }]}>
                {desc ? <Ionicons name="checkmark" size={16} color="#fff" /> : <Text style={irf.stepNumTxt}>4</Text>}
              </View>
              <View style={{ flex:1 }}>
                <FieldLabel>Descripción detallada del problema</FieldLabel>
                <StyledInput value={desc} onChangeText={setDesc} placeholder="Describe la ubicación exacta, gravedad, tiempo llevando el problema, daños reportados..." multiline h={110} />
              </View>
            </View>
          </>
        )}

        {!isReport && (
          <>
            {/* Step 2 - Reporte */}
            <View style={irf.step}>
              <View style={[irf.stepNum, { backgroundColor:repId?Colors.primary:Colors.borderLight }]}>
                {repId ? <Ionicons name="checkmark" size={16} color="#fff" /> : <Text style={irf.stepNumTxt}>2</Text>}
              </View>
              <View style={{ flex:1 }}>
                <FieldLabel>Reporte que atendió</FieldLabel>
                <ReportSelector reports={reports} value={repId} onChange={setRepId} />
              </View>
            </View>

            {/* Step 3 - Descripción */}
            <View style={irf.step}>
              <View style={[irf.stepNum, { backgroundColor:desc?Colors.primary:Colors.borderLight }]}>
                {desc ? <Ionicons name="checkmark" size={16} color="#fff" /> : <Text style={irf.stepNumTxt}>3</Text>}
              </View>
              <View style={{ flex:1 }}>
                <FieldLabel>¿Qué hizo para solucionarlo?</FieldLabel>
                <StyledInput value={desc} onChangeText={setDesc} placeholder="Describe en detalle la acción tomada: qué se hizo, cómo, con quiénes, resultados obtenidos..." multiline h={110} />
              </View>
            </View>
          </>
        )}

        {/* Evidence step (always last) */}
        <View style={irf.step}>
          <View style={[irf.stepNum, { backgroundColor:hasEv?Colors.primary:Colors.borderLight }]}>
            {hasEv ? <Ionicons name="checkmark" size={16} color="#fff" /> : <Text style={irf.stepNumTxt}>{isReport?'5':'4'}</Text>}
          </View>
          <View style={{ flex:1 }}>
            <FieldLabel>Evidencia</FieldLabel>
            <EvidenceToggle value={hasEv} onChange={setHasEv} />
          </View>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[irf.submitBtn, { backgroundColor:color }, !valid && { opacity:.4 }]}
          onPress={handleSave}
          disabled={!valid}
        >
          <Ionicons name="save" size={22} color="#fff" />
          <Text style={irf.submitTxt}>Guardar registro oficial</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const irf = StyleSheet.create({
  formHeader:{ flexDirection:'row', alignItems:'center', gap:16, backgroundColor:Colors.surface, borderRadius:20, padding:20, marginBottom:24, borderLeftWidth:5, borderWidth:1.5, borderColor:Colors.border, shadowColor:'#000', shadowOpacity:.04, shadowRadius:10, shadowOffset:{width:0,height:3}, elevation:3 },
  formHeaderIcon:{ width:54, height:54, borderRadius:16, alignItems:'center', justifyContent:'center' },
  formHeaderTitle:{ fontSize:20, fontWeight:'800', color:Colors.text },
  formHeaderSub:{ fontSize:13, color:Colors.textMuted, marginTop:3 },
  closeBtn:{ width:36, height:36, borderRadius:18, backgroundColor:Colors.borderLight, alignItems:'center', justifyContent:'center' },
  form:{ gap:28 },
  step:{ flexDirection:'row', alignItems:'flex-start', gap:16 },
  stepNum:{ width:32, height:32, borderRadius:16, alignItems:'center', justifyContent:'center', marginTop:2, flexShrink:0 },
  stepNumTxt:{ fontSize:14, fontWeight:'800', color:Colors.textSecondary },
  submitBtn:{ borderRadius:20, height:60, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:12, marginTop:8, shadowColor:'#000', shadowOpacity:.15, shadowRadius:12, shadowOffset:{width:0,height:4}, elevation:6 },
  submitTxt:{ fontSize:17, fontWeight:'800', color:'#fff' },
  successBox:{ flex:1, alignItems:'center', justifyContent:'center', paddingVertical:60 },
  successIcon:{ width:100, height:100, borderRadius:50, backgroundColor:Colors.primaryLight, alignItems:'center', justifyContent:'center', marginBottom:20 },
  successTitle:{ fontSize:28, fontWeight:'900', color:Colors.text, marginBottom:10 },
  successSub:{ fontSize:16, color:Colors.textSecondary, textAlign:'center', maxWidth:380, lineHeight:24 },
  successBtn:{ flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, borderRadius:16, height:52, borderWidth:1.5, borderColor:Colors.primary, backgroundColor:Colors.primaryLight },
});

// ─── Registrar Landing (choose type) ─────────────────────────
function RegistrarSection({ citizens, reports, onSaveReport, onSaveAction }: {
  citizens:Citizen[]; reports:CitizenReport[];
  onSaveReport:(d:any)=>void; onSaveAction:(d:any)=>void;
}) {
  const [activeForm, setActiveForm] = useState<RegType|null>(null);

  if (activeForm) {
    return (
      <InlineRegisterForm
        type={activeForm}
        citizens={citizens}
        reports={reports}
        onSave={activeForm==='report' ? onSaveReport : onSaveAction}
        onDone={()=>setActiveForm(null)}
      />
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap:32, paddingBottom:60, paddingTop:8 }}>
      {/* Hero */}
      <View style={rl.hero}>
        <View style={rl.heroLeft}>
          <View style={rl.heroIcon}><Ionicons name="business" size={32} color={Colors.primary} /></View>
          <View>
            <Text style={rl.heroTitle}>Registro Manual{'\n'}Institucional</Text>
            <Text style={rl.heroSub}>Para ciudadanos sin dispositivo móvil que acuden físicamente con evidencia</Text>
          </View>
        </View>
        <View style={rl.heroBadge}>
          <Ionicons name="shield-checkmark" size={16} color={Colors.primary} />
          <Text style={rl.heroBadgeTxt}>Acceso institucional</Text>
        </View>
      </View>

      {/* Cards */}
      <View style={rl.cardRow}>
        {/* Reporte card */}
        <TouchableOpacity style={rl.bigCard} onPress={()=>setActiveForm('report')}>
          <View style={[rl.bigCardTop, { backgroundColor:Colors.accentLight }]}>
            <Ionicons name="alert-circle" size={52} color={Colors.accent} />
          </View>
          <View style={rl.bigCardBody}>
            <Text style={rl.bigCardTitle}>Registrar Reporte</Text>
            <Text style={rl.bigCardDesc}>
              El ciudadano acude con información y evidencia de un problema ambiental que desea reportar a nombre propio.
            </Text>
            <View style={rl.bigCardSteps}>
              {['Seleccionar ciudadano','Indicar categoría','Describir el problema','Registrar evidencia'].map((s,i)=>(
                <View key={s} style={rl.stepRow}>
                  <View style={[rl.stepDot,{backgroundColor:Colors.accent}]}><Text style={rl.stepN}>{i+1}</Text></View>
                  <Text style={rl.stepTxt}>{s}</Text>
                </View>
              ))}
            </View>
          </View>
          <View style={[rl.bigCardBtn, { backgroundColor:Colors.accent }]}>
            <Text style={rl.bigCardBtnTxt}>Comenzar registro</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </View>
        </TouchableOpacity>

        {/* Acción card */}
        <TouchableOpacity style={rl.bigCard} onPress={()=>setActiveForm('action')}>
          <View style={[rl.bigCardTop, { backgroundColor:'#EDE9FE' }]}>
            <Ionicons name="hand-right" size={52} color="#8B5CF6" />
          </View>
          <View style={rl.bigCardBody}>
            <Text style={rl.bigCardTitle}>Registrar Acción de Ayuda</Text>
            <Text style={rl.bigCardDesc}>
              El ciudadano atendió un reporte existente y acude con evidencia de la solución que llevó a cabo.
            </Text>
            <View style={rl.bigCardSteps}>
              {['Seleccionar ciudadano','Indicar reporte atendido','Describir lo que hizo','Registrar evidencia'].map((s,i)=>(
                <View key={s} style={rl.stepRow}>
                  <View style={[rl.stepDot,{backgroundColor:'#8B5CF6'}]}><Text style={rl.stepN}>{i+1}</Text></View>
                  <Text style={rl.stepTxt}>{s}</Text>
                </View>
              ))}
            </View>
          </View>
          <View style={[rl.bigCardBtn, { backgroundColor:'#8B5CF6' }]}>
            <Text style={rl.bigCardBtnTxt}>Comenzar registro</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
const rl = StyleSheet.create({
  hero:{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', backgroundColor:Colors.surface, borderRadius:22, padding:24, borderWidth:1.5, borderColor:Colors.border, shadowColor:Colors.primary, shadowOpacity:.06, shadowRadius:10, shadowOffset:{width:0,height:3}, elevation:4 },
  heroLeft:{ flexDirection:'row', alignItems:'center', gap:16 },
  heroIcon:{ width:62, height:62, borderRadius:18, backgroundColor:Colors.primaryLight, alignItems:'center', justifyContent:'center' },
  heroTitle:{ fontSize:22, fontWeight:'900', color:Colors.text, lineHeight:28 },
  heroSub:{ fontSize:14, color:Colors.textMuted, marginTop:4, maxWidth:360 },
  heroBadge:{ flexDirection:'row', alignItems:'center', gap:8, backgroundColor:Colors.primaryLight, paddingHorizontal:14, paddingVertical:8, borderRadius:20, borderWidth:1.5, borderColor:Colors.primary+'40' },
  heroBadgeTxt:{ fontSize:13, fontWeight:'700', color:Colors.primary },
  cardRow:{ flexDirection:'row', gap:20 },
  bigCard:{ flex:1, backgroundColor:Colors.surface, borderRadius:24, overflow:'hidden', borderWidth:1.5, borderColor:Colors.border, shadowColor:'#000', shadowOpacity:.06, shadowRadius:14, shadowOffset:{width:0,height:5}, elevation:5 },
  bigCardTop:{ alignItems:'center', justifyContent:'center', paddingVertical:36 },
  bigCardBody:{ padding:24, gap:16, flex:1 },
  bigCardTitle:{ fontSize:22, fontWeight:'900', color:Colors.text },
  bigCardDesc:{ fontSize:14, color:Colors.textSecondary, lineHeight:22 },
  bigCardSteps:{ gap:10 },
  stepRow:{ flexDirection:'row', alignItems:'center', gap:10 },
  stepDot:{ width:26, height:26, borderRadius:13, alignItems:'center', justifyContent:'center' },
  stepN:{ fontSize:13, fontWeight:'800', color:'#fff' },
  stepTxt:{ fontSize:14, color:Colors.textSecondary, fontWeight:'500' },
  bigCardBtn:{ flexDirection:'row', alignItems:'center', justifyContent:'center', gap:10, paddingVertical:18 },
  bigCardBtnTxt:{ fontSize:16, fontWeight:'800', color:'#fff' },
});

// ─── Citizen Detail Modal ─────────────────────────────────────
function CitizenDetailModal({ c, reports, actions, onClose }: { c:Citizen; reports:CitizenReport[]; actions:HelpAction[]; onClose:()=>void }) {
  const myR = reports.filter(r=>r.citizenId===c.id);
  const myA = actions.filter(a=>a.citizenId===c.id);
  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <View style={mu.overlay}>
        <View style={mu.card}>
          <View style={mu.header}>
            <View style={mu.avatarLg}><Text style={mu.avatarLgTxt}>{c.name.charAt(0)}</Text></View>
            <View style={{ flex:1 }}>
              <Text style={mu.name}>{c.name}</Text>
              <Text style={mu.email}>{c.email}</Text>
            </View>
            <TouchableOpacity style={mu.closeX} onPress={onClose}>
              <Ionicons name="close" size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <View style={mu.statsRow}>
            {[
              { n:myR.length, l:'Reportes', icon:'alert-circle', color:Colors.accent },
              { n:myA.length, l:'Acciones', icon:'hand-right',  color:'#8B5CF6' },
              { n:myR.filter(r=>r.registeredBy==='institution').length+myA.filter(a=>a.registeredBy==='institution').length, l:'Reg. manual', icon:'business', color:'#3B82F6' },
            ].map(st => (
              <View key={st.l} style={mu.statBox}>
                <Ionicons name={st.icon as any} size={22} color={st.color} style={{ marginBottom:6 }} />
                <Text style={[mu.statNum,{color:st.color}]}>{st.n}</Text>
                <Text style={mu.statLabel}>{st.l}</Text>
              </View>
            ))}
          </View>
          <ScrollView style={{ maxHeight:340 }} showsVerticalScrollIndicator={false}>
            <Text style={mu.secTitle}>📋 Reportes</Text>
            {myR.length===0 && <Text style={mu.empty}>Sin reportes aún</Text>}
            {myR.map(r => (
              <View key={r.id} style={mu.item}>
                <View style={[mu.catDot,{backgroundColor:CAT_COLORS[r.category]||Colors.category.other}]} />
                <View style={{ flex:1 }}>
                  <Text style={mu.itemTitle}>{r.title}</Text>
                  <Text style={mu.itemSub}>{r.category} · {r.date}</Text>
                </View>
                <EvidencePill has={r.hasEvidence} />
              </View>
            ))}
            <Text style={[mu.secTitle,{marginTop:18}]}>🤝 Acciones de Ayuda</Text>
            {myA.length===0 && <Text style={mu.empty}>Sin acciones aún</Text>}
            {myA.map(a => (
              <View key={a.id} style={mu.item}>
                <View style={[mu.catDot,{backgroundColor:'#8B5CF6'}]} />
                <View style={{ flex:1 }}>
                  <Text style={mu.itemTitle}>{a.description}</Text>
                  <Text style={mu.itemSub}>↳ {a.reportTitle} · {a.date}</Text>
                </View>
                <EvidencePill has={a.hasEvidence} />
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
const mu = StyleSheet.create({
  overlay:{ flex:1, backgroundColor:'rgba(0,0,0,.45)', justifyContent:'center', alignItems:'center' },
  card:{ backgroundColor:Colors.surface, borderRadius:24, padding:28, width:'90%', maxWidth:580, shadowColor:'#000', shadowOpacity:.2, shadowRadius:30, shadowOffset:{width:0,height:12}, elevation:20 },
  header:{ flexDirection:'row', alignItems:'center', gap:16, marginBottom:22 },
  avatarLg:{ width:56, height:56, borderRadius:28, backgroundColor:Colors.primary, alignItems:'center', justifyContent:'center' },
  avatarLgTxt:{ fontSize:22, fontWeight:'900', color:'#fff' },
  name:{ fontSize:20, fontWeight:'800', color:Colors.text },
  email:{ fontSize:13, color:Colors.textMuted, marginTop:2 },
  closeX:{ width:36, height:36, borderRadius:18, backgroundColor:Colors.borderLight, alignItems:'center', justifyContent:'center' },
  statsRow:{ flexDirection:'row', gap:12, marginBottom:20 },
  statBox:{ flex:1, backgroundColor:Colors.background, borderRadius:16, padding:16, alignItems:'center', borderWidth:1, borderColor:Colors.border },
  statNum:{ fontSize:26, fontWeight:'900' },
  statLabel:{ fontSize:12, color:Colors.textSecondary, fontWeight:'600', marginTop:2, textAlign:'center' },
  secTitle:{ fontSize:13, fontWeight:'700', color:Colors.textSecondary, textTransform:'uppercase', letterSpacing:.6, marginBottom:12 },
  item:{ flexDirection:'row', alignItems:'center', gap:12, paddingVertical:12, borderBottomWidth:1, borderBottomColor:Colors.borderLight },
  catDot:{ width:10, height:10, borderRadius:5, flexShrink:0 },
  itemTitle:{ fontSize:14, fontWeight:'600', color:Colors.text },
  itemSub:{ fontSize:12, color:Colors.textMuted, marginTop:2 },
  empty:{ fontSize:13, color:Colors.textMuted, fontStyle:'italic', marginBottom:8 },
});

// ─── Ciudadanos ───────────────────────────────────────────────
function CiudadanosSection({ citizens, reports, actions }: { citizens:Citizen[]; reports:CitizenReport[]; actions:HelpAction[] }) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Citizen|null>(null);
  const filtered = search ? citizens.filter(c=>c.name.toLowerCase().includes(search.toLowerCase())) : citizens;
  return (
    <View style={{ flex:1 }}>
      <View style={cs.searchBox}>
        <Ionicons name="search" size={20} color={Colors.textMuted} />
        <TextInput style={cs.searchInput} value={search} onChangeText={setSearch} placeholder="Buscar ciudadano..." placeholderTextColor={Colors.textMuted} />
        {search?<TouchableOpacity onPress={()=>setSearch('')}><Ionicons name="close-circle" size={20} color={Colors.textMuted} /></TouchableOpacity>:null}
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap:12, paddingBottom:40 }}>
        {filtered.map(c => {
          const rCount = reports.filter(r=>r.citizenId===c.id).length;
          const aCount = actions.filter(a=>a.citizenId===c.id).length;
          const instCount = reports.filter(r=>r.citizenId===c.id&&r.registeredBy==='institution').length+actions.filter(a=>a.citizenId===c.id&&a.registeredBy==='institution').length;
          return (
            <TouchableOpacity key={c.id} style={cs.card} onPress={()=>setSelected(c)}>
              <View style={cs.avatar}><Text style={cs.avatarTxt}>{c.name.charAt(0)}</Text></View>
              <View style={{ flex:1 }}>
                <Text style={cs.name}>{c.name}</Text>
                <Text style={cs.email}>{c.email}</Text>
              </View>
              <View style={{ flexDirection:'row', gap:8 }}>
                <View style={cs.statChip}><Ionicons name="alert-circle" size={14} color={Colors.accent} /><Text style={[cs.statTxt,{color:Colors.accent}]}>{rCount}</Text></View>
                <View style={cs.statChip}><Ionicons name="hand-right" size={14} color="#8B5CF6" /><Text style={[cs.statTxt,{color:'#8B5CF6'}]}>{aCount}</Text></View>
                {instCount>0&&<View style={[cs.statChip,{backgroundColor:'#DBEAFE'}]}><Ionicons name="business" size={14} color="#1D4ED8" /><Text style={[cs.statTxt,{color:'#1D4ED8'}]}>{instCount}</Text></View>}
              </View>
              <View style={cs.arrowBox}><Ionicons name="chevron-forward" size={20} color={Colors.primary} /></View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      {selected&&<CitizenDetailModal c={selected} reports={reports} actions={actions} onClose={()=>setSelected(null)} />}
    </View>
  );
}
const cs = StyleSheet.create({
  searchBox:{ flexDirection:'row', alignItems:'center', gap:12, backgroundColor:Colors.surface, borderRadius:16, borderWidth:1.5, borderColor:Colors.border, paddingHorizontal:16, height:52, marginBottom:16 },
  searchInput:{ flex:1, fontSize:15, color:Colors.text },
  card:{ flexDirection:'row', alignItems:'center', gap:14, backgroundColor:Colors.surface, borderRadius:20, padding:18, borderWidth:1.5, borderColor:Colors.border, shadowColor:Colors.primary, shadowOpacity:.05, shadowRadius:8, shadowOffset:{width:0,height:3}, elevation:2 },
  avatar:{ width:52, height:52, borderRadius:26, backgroundColor:Colors.primaryLight, borderWidth:2, borderColor:Colors.primary, alignItems:'center', justifyContent:'center' },
  avatarTxt:{ fontSize:20, fontWeight:'900', color:Colors.primary },
  name:{ fontSize:16, fontWeight:'700', color:Colors.text },
  email:{ fontSize:13, color:Colors.textMuted, marginTop:2 },
  statChip:{ flexDirection:'row', alignItems:'center', gap:5, backgroundColor:Colors.borderLight, paddingHorizontal:10, paddingVertical:6, borderRadius:20 },
  statTxt:{ fontSize:14, fontWeight:'800' },
  arrowBox:{ width:36, height:36, borderRadius:18, backgroundColor:Colors.primaryLight, alignItems:'center', justifyContent:'center' },
});

// ─── Table helpers ────────────────────────────────────────────
function ReportesSection({ reports }: { reports:CitizenReport[] }) {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom:40 }}>
      <View style={tb.card}>
        <View style={[tb.row, tb.head]}>
          {[{l:'Título',f:2},{l:'Ciudadano',f:1},{l:'Categoría',w:110},{l:'Fecha',w:100},{l:'Evidencia',w:130},{l:'Origen',w:130}].map(c=>(
            <Text key={c.l} style={[tb.th,c.f?{flex:c.f}:{width:c.w}]}>{c.l}</Text>
          ))}
        </View>
        {reports.map((r,i)=>(
          <View key={r.id} style={[tb.row, i%2===0&&{backgroundColor:Colors.background}]}>
            <View style={{flex:2,flexDirection:'row',alignItems:'center',gap:8}}>
              <View style={[tb.catDot,{backgroundColor:CAT_COLORS[r.category]||Colors.category.other}]} />
              <Text style={[tb.td,{flex:1}]} numberOfLines={1}>{r.title}</Text>
            </View>
            <Text style={[tb.td,{flex:1}]} numberOfLines={1}>{r.citizenName}</Text>
            <View style={{width:110}}><Pill label={r.category} color={CAT_COLORS[r.category]||Colors.category.other} bg={(CAT_COLORS[r.category]||Colors.category.other)+'20'} /></View>
            <Text style={[tb.td,{width:100,color:Colors.textMuted}]}>{r.date}</Text>
            <View style={{width:130}}><EvidencePill has={r.hasEvidence} /></View>
            <View style={{width:130}}><RegPill by={r.registeredBy} /></View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
function AccionesSection({ actions }: { actions:HelpAction[] }) {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom:40 }}>
      <View style={tb.card}>
        <View style={[tb.row, tb.head]}>
          {[{l:'Ciudadano',f:1.2},{l:'Reporte atendido',f:1.5},{l:'Descripción',f:2},{l:'Fecha',w:90},{l:'Evidencia',w:130},{l:'Origen',w:130}].map(c=>(
            <Text key={c.l} style={[tb.th,c.f?{flex:c.f}:{width:c.w}]}>{c.l}</Text>
          ))}
        </View>
        {actions.map((a,i)=>(
          <View key={a.id} style={[tb.row, i%2===0&&{backgroundColor:Colors.background}]}>
            <Text style={[tb.td,{flex:1.2,fontWeight:'700'}]} numberOfLines={1}>{a.citizenName}</Text>
            <Text style={[tb.td,{flex:1.5}]} numberOfLines={1}>{a.reportTitle}</Text>
            <Text style={[tb.td,{flex:2}]} numberOfLines={2}>{a.description}</Text>
            <Text style={[tb.td,{width:90,color:Colors.textMuted}]}>{a.date}</Text>
            <View style={{width:130}}><EvidencePill has={a.hasEvidence} /></View>
            <View style={{width:130}}><RegPill by={a.registeredBy} /></View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
const tb = StyleSheet.create({
  card:{ backgroundColor:Colors.surface, borderRadius:20, overflow:'hidden', borderWidth:1.5, borderColor:Colors.border, shadowColor:'#000', shadowOpacity:.04, shadowRadius:8, shadowOffset:{width:0,height:2}, elevation:2 },
  head:{ backgroundColor:Colors.background, borderBottomWidth:1.5, borderBottomColor:Colors.border },
  row:{ flexDirection:'row', alignItems:'center', paddingHorizontal:18, paddingVertical:14, borderBottomWidth:1, borderBottomColor:Colors.borderLight, gap:12 },
  th:{ fontSize:11, fontWeight:'800', color:Colors.textSecondary, textTransform:'uppercase', letterSpacing:.6 },
  td:{ fontSize:14, color:Colors.text },
  catDot:{ width:10, height:10, borderRadius:5, flexShrink:0 },
});

// ─── Root Screen ─────────────────────────────────────────────
export default function AdminScreen() {
  const router = useRouter();
  const { setIsAdmin } = useAuth();
  const insets = useSafeAreaInsets();
  const [section, setSection] = useState<Section>('registrar');
  const [reports, setReports] = useState<CitizenReport[]>(SEED_REPORTS);
  const [actions, setActions] = useState<HelpAction[]>(SEED_ACTIONS);

  const addReport = (d: Omit<CitizenReport,'id'>) => setReports(p=>[{id:`rp${Date.now()}`,...d},...p]);
  const addAction = (d: Omit<HelpAction,'id'>)   => setActions(p=>[{id:`ha${Date.now()}`,...d},...p]);

  const TITLES: Record<Section,string> = { registrar:'Registro Manual', ciudadanos:'Ciudadanos', reportes:'Reportes', acciones:'Acciones de Ayuda' };

  return (
    <View style={[s.root, { paddingTop:insets.top }]}>
      {/* Sidebar */}
      <View style={s.sidebar}>
        <View style={s.brand}>
          <View style={s.brandLogo}><Ionicons name="leaf" size={24} color="#fff" /></View>
          <View>
            <Text style={s.brandName}>Social Clean</Text>
            <Text style={s.brandRole}>Panel Institucional</Text>
          </View>
        </View>

        <ScrollView style={{ flex:1 }} showsVerticalScrollIndicator={false}>
          <Text style={s.navGroup}>NAVEGACIÓN</Text>
          {NAV.map(item=>{
            const active = section===item.id;
            return (
              <TouchableOpacity key={item.id} style={[s.navItem, active&&{backgroundColor:item.color+'15'}]} onPress={()=>setSection(item.id)}>
                <View style={[s.navIconBox, {backgroundColor: active?item.color+'22':Colors.borderLight}]}>
                  <Ionicons name={item.icon as any} size={20} color={active?item.color:Colors.textMuted} />
                </View>
                <Text style={[s.navLabel, active&&{color:item.color,fontWeight:'700'}]}>{item.label}</Text>
                {active&&<View style={[s.navDot,{backgroundColor:item.color}]} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={s.summaryCard}>
          <Text style={s.summaryTitle}>RESUMEN</Text>
          <View style={s.summaryRow}><Ionicons name="alert-circle" size={15} color={Colors.accent} /><Text style={s.summaryTxt}>{reports.length} reportes</Text></View>
          <View style={s.summaryRow}><Ionicons name="hand-right"   size={15} color="#8B5CF6" /><Text style={s.summaryTxt}>{actions.length} acciones</Text></View>
          <View style={s.summaryRow}><Ionicons name="business"     size={15} color="#3B82F6" /><Text style={s.summaryTxt}>{reports.filter(r=>r.registeredBy==='institution').length+actions.filter(a=>a.registeredBy==='institution').length} reg. manuales</Text></View>
        </View>

        <TouchableOpacity style={s.logoutBtn} onPress={()=>{ setIsAdmin(false); router.replace('/login' as any); }}>
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={s.logoutTxt}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={s.content}>
        <View style={s.topbar}>
          <Text style={s.pageTitle}>{TITLES[section]}</Text>
          <View style={s.instBadge}>
            <Ionicons name="shield-checkmark" size={16} color={Colors.primary} />
            <Text style={s.instBadgeTxt}>Vista Institucional</Text>
          </View>
        </View>
        <View style={{ flex:1 }}>
          {section==='registrar'  && <RegistrarSection citizens={CITIZENS} reports={reports} onSaveReport={addReport} onSaveAction={addAction} />}
          {section==='ciudadanos' && <CiudadanosSection citizens={CITIZENS} reports={reports} actions={actions} />}
          {section==='reportes'   && <ReportesSection  reports={reports} />}
          {section==='acciones'   && <AccionesSection  actions={actions} />}
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:{ flex:1, flexDirection:'row', backgroundColor:Colors.background },
  sidebar:{ width:SIDEBAR_W, backgroundColor:Colors.surface, borderRightWidth:1.5, borderRightColor:Colors.border, paddingHorizontal:18, paddingVertical:20, gap:4 },
  brand:{ flexDirection:'row', alignItems:'center', gap:12, marginBottom:24, paddingBottom:20, borderBottomWidth:1, borderBottomColor:Colors.border },
  brandLogo:{ width:46, height:46, borderRadius:14, backgroundColor:Colors.primary, alignItems:'center', justifyContent:'center', shadowColor:Colors.primary, shadowOpacity:.4, shadowRadius:8, shadowOffset:{width:0,height:3}, elevation:6 },
  brandName:{ fontSize:16, fontWeight:'900', color:Colors.text },
  brandRole:{ fontSize:11, color:Colors.textMuted, fontWeight:'500', marginTop:2 },
  navGroup:{ fontSize:10, fontWeight:'800', color:Colors.textMuted, letterSpacing:1, marginBottom:10, marginLeft:4 },
  navItem:{ flexDirection:'row', alignItems:'center', gap:12, paddingVertical:12, paddingHorizontal:12, borderRadius:16, marginBottom:4 },
  navIconBox:{ width:38, height:38, borderRadius:12, alignItems:'center', justifyContent:'center' },
  navLabel:{ fontSize:14, color:Colors.textSecondary, fontWeight:'500', flex:1 },
  navDot:{ width:7, height:7, borderRadius:4 },
  summaryCard:{ backgroundColor:Colors.background, borderRadius:18, padding:16, gap:10, borderWidth:1.5, borderColor:Colors.border, marginTop:8, marginBottom:12 },
  summaryTitle:{ fontSize:10, fontWeight:'900', color:Colors.textMuted, letterSpacing:1 },
  summaryRow:{ flexDirection:'row', alignItems:'center', gap:8 },
  summaryTxt:{ fontSize:13, color:Colors.text, fontWeight:'600' },
  logoutBtn:{ flexDirection:'row', alignItems:'center', gap:10, paddingVertical:14, paddingHorizontal:14, backgroundColor:'#FEF2F2', borderRadius:16, borderWidth:1.5, borderColor:'#FECACA' },
  logoutTxt:{ fontSize:14, color:Colors.error, fontWeight:'700' },
  content:{ flex:1, padding:28 },
  topbar:{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:24 },
  pageTitle:{ fontSize:28, fontWeight:'900', color:Colors.text, letterSpacing:-.5 },
  instBadge:{ flexDirection:'row', alignItems:'center', gap:8, backgroundColor:Colors.primaryLight, paddingHorizontal:16, paddingVertical:8, borderRadius:24, borderWidth:1.5, borderColor:Colors.primary+'40' },
  instBadgeTxt:{ fontSize:14, fontWeight:'700', color:Colors.primary },
});
