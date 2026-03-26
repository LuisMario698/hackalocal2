import React, { useState, useRef } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Image,
  KeyboardAvoidingView, Platform, useWindowDimensions,
} from 'react-native';
import Text from '../components/ScaledText';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import ReportMapPicker from '../components/ReportMapPicker';
import { useUserLocation } from '../hooks/useUserLocation';

// ─── Types ────────────────────────────────────────────────────
interface Citizen { id: string; name: string; email: string; }
interface CitizenReport {
  id: string; citizenId: string; citizenName: string;
  title: string; category: string; description: string;
  date: string; hasEvidence: boolean; registeredBy: 'self' | 'institution';
  location?: string;
}
interface HelpAction {
  id: string; citizenId: string; citizenName: string;
  reportId: string; reportTitle: string; description: string;
  date: string; hasEvidence: boolean; registeredBy: 'self' | 'institution';
  location?: string;
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
  { id:'rp1', citizenId:'c1', citizenName:'María López',    title:'Basura en la playa principal',         category:'Basura',        description:'Botellas y plásticos en la orilla.',  date:'2026-03-20', hasEvidence:true,  registeredBy:'self', location:'Playa principal, malecón' },
  { id:'rp2', citizenId:'c2', citizenName:'Carlos Mendoza', title:'Basura acumulada en parque',            category:'Basura',        description:'Llevan 3 días sin recoger.',          date:'2026-03-22', hasEvidence:false, registeredBy:'self', location:'Parque central, zona norte' },
  { id:'rp3', citizenId:'c3', citizenName:'Ana Rodríguez',  title:'Drenaje desbordado en Col. Esperanza', category:'Agua',          description:'El drenaje lleva desbordado.',       date:'2026-03-23', hasEvidence:true,  registeredBy:'institution', location:'Colonia Esperanza, calle 12' },
  { id:'rp4', citizenId:'c1', citizenName:'María López',    title:'Fauna herida cerca del malecón',       category:'Fauna',         description:'Pelícano con ala rota.',             date:'2026-03-24', hasEvidence:true,  registeredBy:'self', location:'Malecón turístico, acceso 3' },
  { id:'rp5', citizenId:'c4', citizenName:'Esteban García', title:'Electrónicos abandonados',             category:'Electrónicos',  description:'TV y refrigerador abandonados.',     date:'2026-03-18', hasEvidence:false, registeredBy:'institution', location:'Colonia Centro, lote baldío' },
];
const SEED_ACTIONS: HelpAction[] = [
  { id:'ha1', citizenId:'c1', citizenName:'María López',    reportId:'rp2', reportTitle:'Basura en parque',   description:'Organizó limpieza con voluntarios.', date:'2026-03-23', hasEvidence:true,  registeredBy:'self', location:'Parque central, zona norte' },
  { id:'ha2', citizenId:'c2', citizenName:'Carlos Mendoza', reportId:'rp1', reportTitle:'Basura en la playa', description:'Recogió basura con bolsas y guantes.',date:'2026-03-21', hasEvidence:false, registeredBy:'self', location:'Playa principal, malecón' },
  { id:'ha3', citizenId:'c3', citizenName:'Ana Rodríguez',  reportId:'rp3', reportTitle:'Drenaje desbordado',  description:'Coordinó cuadrilla municipal.',       date:'2026-03-24', hasEvidence:true,  registeredBy:'institution', location:'Colonia Esperanza, calle 12' },
  { id:'ha4', citizenId:'c5', citizenName:'Sofía Martínez', reportId:'rp4', reportTitle:'Fauna herida',        description:'Llevó animal a veterinario.',         date:'2026-03-25', hasEvidence:true,  registeredBy:'institution', location:'Malecón turístico, acceso 3' },
];

const CATEGORIES = ['Basura','Agua','Fauna','Electrónicos','Orgánico','Otro'];
const CAT_COLORS: Record<string,string> = {
  Basura: Colors.category.trash, Agua: Colors.category.drain,
  Fauna: Colors.category.wildlife, Electrónicos: Colors.category.electronic,
  Orgánico: Colors.category.organic, Otro: Colors.category.other,
};

const REF_IMAGES: Record<string, string> = {
  basura: 'https://picsum.photos/seed/socialclean-basura/1200/700',
  agua: 'https://picsum.photos/seed/socialclean-agua/1200/700',
  fauna: 'https://picsum.photos/seed/socialclean-fauna/1200/700',
  electronicos: 'https://picsum.photos/seed/socialclean-electronicos/1200/700',
  organico: 'https://picsum.photos/seed/socialclean-organico/1200/700',
  otro: 'https://picsum.photos/seed/socialclean-otro/1200/700',
  accion: 'https://picsum.photos/seed/socialclean-accion/1200/700',
};

function normalizeCategory(category: string) {
  return category
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function getReferenceImage(category: string, kind: 'report' | 'action') {
  if (kind === 'action') return REF_IMAGES.accion;
  const normalized = normalizeCategory(category);
  return REF_IMAGES[normalized] ?? REF_IMAGES.otro;
}
const SIDEBAR_W = 240;

// Nav order: Dashboard first
type Section = 'dashboard'|'registrar'|'ciudadanos'|'reportes'|'acciones';
const NAV: { id:Section; label:string; icon:string; color:string }[] = [
  { id:'dashboard', label:'Dashboard',          icon:'bar-chart',       color:'#0EA5A5' },
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

function EvidencePillLg({ has }:{ has:boolean }) {
  return (
    <View style={[mdl.pillLg, { backgroundColor: has ? Colors.primaryLight : Colors.borderLight }]}>
      <Ionicons name={has ? 'checkmark-circle' : 'close-circle'} size={16} color={has ? Colors.primary : Colors.textMuted} />
      <Text style={[mdl.pillLgText, { color: has ? Colors.primary : Colors.textMuted }]}>
        {has ? 'Con evidencia' : 'Sin evidencia'}
      </Text>
    </View>
  );
}

function RegPillLg({ by }:{ by:'self'|'institution' }) {
  const isInstitution = by === 'institution';
  return (
    <View style={[mdl.pillLg, { backgroundColor: isInstitution ? '#EDE9FE' : '#DBEAFE' }]}>
      <Ionicons name={isInstitution ? 'business' : 'phone-portrait'} size={15} color={isInstitution ? '#7C3AED' : '#1D4ED8'} />
      <Text style={[mdl.pillLgText, { color: isInstitution ? '#7C3AED' : '#1D4ED8' }]}>
        {isInstitution ? 'Institución' : 'Móvil'}
      </Text>
    </View>
  );
}

function CoveredPillLg({ covered, byName }:{ covered:boolean; byName?: string | null }) {
  const label = covered ? (byName ? `Cubierto por ${byName}` : 'Cubierto') : 'Sin cubrir';
  const isInteractive = covered && !!byName;

  const pillContent = (
    <>
      <Ionicons
        name={covered ? 'checkmark-done-circle' : 'hourglass-outline'}
        size={16}
        color={covered ? '#166534' : '#92400E'}
      />
      <Text style={[mdl.pillLgText, { color: covered ? '#166534' : '#92400E' }]}>
        {label}
      </Text>
      {isInteractive ? <Ionicons name="chevron-forward" size={13} color="#166534" /> : null}
    </>
  );

  if (isInteractive) {
    return (
      <TouchableOpacity style={[mdl.pillLg, { backgroundColor: '#DCFCE7' }]} activeOpacity={0.8}>
        {pillContent}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[mdl.pillLg, { backgroundColor: covered ? '#DCFCE7' : '#FEF3C7' }]}>
      {pillContent}
    </View>
  );
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
  label:{ fontSize:14, fontWeight:'700', color:'#1A1D21', marginBottom:8 },
  input:{ backgroundColor:'#FFFFFF', borderWidth:1, borderColor:'#E8ECF0', borderRadius:16, paddingHorizontal:18, height:56, fontSize:15, color:'#1A1D21' },
  inputFocused:{ borderColor:'#1D9E75', backgroundColor:'#FFFFFF', shadowColor:'#1D9E75', shadowOpacity:0.1, shadowRadius:4, shadowOffset:{width:0,height:2}, elevation:2 },
});

// ─── Citizen selector chips (Autocomplete) ────────────────────
function CitizenSelector({ citizens, value, onChange }: { citizens:Citizen[]; value:string; onChange:(id:string)=>void }) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);

  const selectedC = citizens.find(c => c.id === value);
  if (selectedC) {
    return (
      <View style={caut.selectedCard}>
        <View style={caut.avatar}><Text style={caut.avatarTxt}>{selectedC.name.charAt(0)}</Text></View>
        <View style={{ flex:1 }}>
          <Text style={caut.name}>{selectedC.name}</Text>
          <Text style={caut.email}>{selectedC.email}</Text>
        </View>
        <TouchableOpacity style={caut.clearBtn} onPress={() => { onChange(''); setQuery(''); }}>
          <Ionicons name="close" size={18} color="#6B7280" />
        </TouchableOpacity>
      </View>
    );
  }

  const filtered = query ? citizens.filter(c => c.name.toLowerCase().includes(query.toLowerCase()) || c.email.toLowerCase().includes(query.toLowerCase())) : [];
  const showDropdown = focused && query.length > 0;

  return (
    <View style={{ zIndex: 10 }}>
      <View style={[caut.inputBox, focused && caut.inputFocused]}>
        <Ionicons name="search" size={20} color={focused ? '#1D9E75' : '#9CA3AF'} />
        <TextInput
          style={caut.input}
          placeholder="Escribe el nombre del ciudadano..."
          placeholderTextColor="#9CA3AF"
          value={query}
          onChangeText={setQuery}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
        />
      </View>
      {showDropdown && (
        <View style={caut.dropdown}>
          {filtered.length > 0 ? filtered.map(c => (
            <TouchableOpacity key={c.id} style={caut.dropItem} onPress={() => onChange(c.id)}>
              <View style={caut.dropAvatar}><Text style={caut.dropAvatarTxt}>{c.name.charAt(0)}</Text></View>
              <View>
                <Text style={caut.dropName}>{c.name}</Text>
                <Text style={caut.dropEmail}>{c.email}</Text>
              </View>
            </TouchableOpacity>
          )) : (
            <View style={caut.dropEmpty}>
              <Text style={caut.dropEmptyTitle}>No encontrado</Text>
              <Text style={caut.dropEmptySub}>Verifica el nombre o registra uno nuevo</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
const caut = StyleSheet.create({
  selectedCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#1D9E75', borderRadius: 16, padding: 14, shadowColor: '#1D9E75', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: {width:0,height:2}, elevation: 2 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E1F5EE', alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { fontSize: 18, fontWeight: '700', color: '#1D9E75' },
  name: { fontSize: 16, fontWeight: '700', color: '#1A1D21' },
  email: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  clearBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F5F7FA', alignItems: 'center', justifyContent: 'center' },
  inputBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8ECF0', borderRadius: 16, paddingHorizontal: 16, height: 56 },
  inputFocused: { borderColor: '#1D9E75', shadowColor: '#1D9E75', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: {width:0,height:2}, elevation: 2 },
  input: { flex: 1, fontSize: 15, color: '#1A1D21', outlineStyle: 'none' } as any,
  dropdown: { position: 'absolute', top: 62, left: 0, right: 0, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E8ECF0', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: {width:0,height:4}, elevation: 5, padding: 8, maxHeight: 240, overflow: 'hidden' },
  dropItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 12 },
  dropAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#F5F7FA', alignItems: 'center', justifyContent: 'center' },
  dropAvatarTxt: { fontSize: 15, fontWeight: '700', color: '#6B7280' },
  dropName: { fontSize: 15, fontWeight: '700', color: '#1A1D21' },
  dropEmail: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  dropEmpty: { padding: 24, alignItems: 'center' },
  dropEmptyTitle: { fontSize: 15, fontWeight: '700', color: '#1A1D21' },
  dropEmptySub: { fontSize: 13, color: '#6B7280', marginTop: 4 },
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
  chip:{ flexDirection:'row', alignItems:'center', gap:8, paddingHorizontal:16, paddingVertical:10, borderRadius:24, borderWidth:1, borderColor:'#E8ECF0', backgroundColor:'#FFFFFF' },
  dot:{ width:10, height:10, borderRadius:5 },
  txt:{ fontSize:14, fontWeight:'600', color:'#1A1D21' },
});

// ─── Evidence upload ──────────────────────────────────────────
function EvidenceToggle({ value, onChange }: { value:boolean; onChange:(v:boolean)=>void }) {
  if (value) {
    return (
      <View style={upz.successCard}>
        <View style={upz.successIconBox}><Ionicons name="document-text" size={24} color="#1D9E75" /></View>
        <View style={{ flex:1 }}>
          <Text style={upz.successTitle}>Evidencia subida exitosamente</Text>
          <Text style={upz.successSub}>evidencia_adjunta.jpg (2.4 MB)</Text>
        </View>
        <TouchableOpacity style={upz.removeBtn} onPress={()=>onChange(false)}>
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity style={upz.dropzone} onPress={()=>onChange(true)}>
      <View style={upz.iconCircle}>
        <Ionicons name="cloud-upload-outline" size={32} color="#1D9E75" />
      </View>
      <Text style={upz.dzTitle}>Subir archivo de evidencia</Text>
      <Text style={upz.dzSub}>Haz clic para adjuntar fotos, videos o documentos que respalden el reporte</Text>
      <View style={upz.dzBtn}>
        <Text style={upz.dzBtnTxt}>Explorar archivos</Text>
      </View>
    </TouchableOpacity>
  );
}
const upz = StyleSheet.create({
  dropzone: { backgroundColor: '#F9FAFB', borderWidth: 2, borderColor: '#E8ECF0', borderStyle: 'dashed', borderRadius: 20, padding: 32, alignItems: 'center', justifyContent: 'center' },
  iconCircle: { width: 68, height: 68, borderRadius: 34, backgroundColor: '#E1F5EE', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  dzTitle: { fontSize: 16, fontWeight: '800', color: '#1A1D21', marginBottom: 6 },
  dzSub: { fontSize: 13, color: '#6B7280', textAlign: 'center', maxWidth: 300, marginBottom: 20, lineHeight: 20 },
  dzBtn: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8ECF0', paddingHorizontal: 22, paddingVertical: 12, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 2, shadowOffset: {width:0,height:1}, elevation: 1 },
  dzBtnTxt: { fontSize: 14, fontWeight: '700', color: '#1A1D21' },
  
  successCard: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#BBEFD0', borderRadius: 20, padding: 20 },
  successIconBox: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center' },
  successTitle: { fontSize: 16, fontWeight: '800', color: '#166534' },
  successSub: { fontSize: 13, color: '#15803D', marginTop: 4 },
  removeBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' },
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
  item:{ flexDirection:'row', alignItems:'center', gap:12, borderWidth:1, borderColor:'#E8ECF0', borderRadius:16, padding:14, backgroundColor:'#FFFFFF' },
  dot:{ width:12, height:12, borderRadius:6, flexShrink:0 },
  title:{ fontSize:15, fontWeight:'700', color:'#1A1D21' },
  sub:{ fontSize:12, color:'#6B7280', marginTop:2 },
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

  // Map state
  const [pinCoord, setPinCoord] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mapExpanded, setMapExpanded] = useState(false);
  const mapRef = useRef<any>(null);
  const { location } = useUserLocation();
  const userLat = location?.latitude ?? 31.3182;
  const userLng = location?.longitude ?? -113.5348;
  const handleMapPress = (e: { nativeEvent: { coordinate: { latitude: number; longitude: number } } }) => setPinCoord(e.nativeEvent.coordinate);

  const isReport = type==='report';
  const color = isReport ? Colors.accent : '#8B5CF6';
  const colorBg = isReport ? Colors.accentLight : '#EDE9FE';
  const icon = isReport ? 'alert-circle' : 'hand-right';
  const valid = cId && desc && pinCoord && (isReport ? title && cat : repId);

  const handleSave = () => {
    if (!valid) return;
    const citizen = citizens.find(c=>c.id===cId)!;
    const today = new Date().toISOString().slice(0,10);
    const locationText = pinCoord
      ? `Lat ${pinCoord.latitude.toFixed(4)}, Lng ${pinCoord.longitude.toFixed(4)}`
      : 'Sin ubicación';
    if (isReport) {
      onSave({ citizenId:cId, citizenName:citizen.name, title, category:cat, description:desc, date:today, hasEvidence:hasEv, registeredBy:'institution', location: locationText });
    } else {
      const rep = reports.find(r=>r.id===repId)!;
      onSave({ citizenId:cId, citizenName:citizen.name, reportId:repId, reportTitle:rep.title, description:desc, date:today, hasEvidence:hasEv, registeredBy:'institution', location: rep.location ?? locationText });
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

        {/* Map step (always before evidence) */}
        <View style={irf.step}>
          <View style={[irf.stepNum, { backgroundColor:pinCoord?Colors.primary:Colors.borderLight }]}>
            {pinCoord ? <Ionicons name="checkmark" size={16} color="#fff" /> : <Text style={irf.stepNumTxt}>{isReport?'5':'4'}</Text>}
          </View>
          <View style={{ flex:1 }}>
            <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'flex-end', marginBottom:12 }}>
               <View style={{ flex:1, paddingRight:16 }}>
                 <FieldLabel>{`Ubicación exacta de ${isReport ? 'la incidencia' : 'la acción'}`}</FieldLabel>
                 <Text style={{ fontSize:13, color:'#6B7280', lineHeight:18 }}>Marca en el mapa el lugar exacto. Haz clic para colocar un pin.</Text>
               </View>
               <TouchableOpacity 
                  onPress={() => setMapExpanded(!mapExpanded)} 
                  style={{ flexDirection:'row', alignItems:'center', gap:6, backgroundColor:'#F3F4F6', paddingHorizontal:12, paddingVertical:8, borderRadius:20 }}
               >
                 <Ionicons name={mapExpanded ? "contract" : "expand"} size={14} color="#4B5563" />
                 <Text style={{ fontSize:13, fontWeight:'700', color:'#4B5563' }}>{mapExpanded ? 'Contraer' : 'Expandir'}</Text>
               </TouchableOpacity>
            </View>
            <View style={{ height:mapExpanded ? 550 : 260, borderRadius:16, overflow:'hidden', borderWidth:1, borderColor:'#E8ECF0' }}>
              <ReportMapPicker
                userLat={userLat}
                userLng={userLng}
                pinCoord={pinCoord}
                onPress={handleMapPress}
                mapRef={mapRef}
                maxDistance={999999}
              />
            </View>
            {pinCoord && (
              <View style={{ flexDirection:'row', alignItems:'center', gap:6, marginTop:10 }}>
                <Ionicons name="location" size={16} color="#1D9E75" />
                <Text style={{ fontSize:13, color:'#1D9E75', fontWeight:'700' }}>Ubicación fijada correctamente</Text>
              </View>
            )}
          </View>
        </View>

        {/* Evidence step (always last) */}
        <View style={irf.step}>
          <View style={[irf.stepNum, { backgroundColor:hasEv?Colors.primary:Colors.borderLight }]}>
            {hasEv ? <Ionicons name="checkmark" size={16} color="#fff" /> : <Text style={irf.stepNumTxt}>{isReport?'6':'5'}</Text>}
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
  formHeader:{ flexDirection:'row', alignItems:'center', gap:16, backgroundColor:'#FFFFFF', borderRadius:20, padding:20, marginBottom:24, borderLeftWidth:4, borderWidth:1, borderColor:'#E8ECF0', shadowColor:'#000', shadowOpacity:0.04, shadowRadius:4, shadowOffset:{width:0,height:1}, elevation:2 },
  formHeaderIcon:{ width:54, height:54, borderRadius:16, alignItems:'center', justifyContent:'center' },
  formHeaderTitle:{ fontSize:20, fontWeight:'800', color:'#1A1D21' },
  formHeaderSub:{ fontSize:13, color:'#6B7280', marginTop:3, lineHeight:18 },
  closeBtn:{ width:36, height:36, borderRadius:18, backgroundColor:'#F5F7FA', alignItems:'center', justifyContent:'center' },
  form:{ gap:28 },
  step:{ flexDirection:'row', alignItems:'flex-start', gap:16 },
  stepNum:{ width:32, height:32, borderRadius:16, alignItems:'center', justifyContent:'center', marginTop:2, flexShrink:0 },
  stepNumTxt:{ fontSize:14, fontWeight:'700', color:'#6B7280' },
  submitBtn:{ borderRadius:20, height:60, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:12, marginTop:12, shadowColor:'#1D9E75', shadowOpacity:0.2, shadowRadius:8, shadowOffset:{width:0,height:4}, elevation:4 },
  submitTxt:{ fontSize:17, fontWeight:'700', color:'#fff' },
  successBox:{ flex:1, alignItems:'center', justifyContent:'center', paddingVertical:60 },
  successIcon:{ width:100, height:100, borderRadius:50, backgroundColor:'#E1F5EE', alignItems:'center', justifyContent:'center', marginBottom:20 },
  successTitle:{ fontSize:28, fontWeight:'800', color:'#1A1D21', marginBottom:10 },
  successSub:{ fontSize:16, color:'#6B7280', textAlign:'center', maxWidth:380, lineHeight:24 },
  successBtn:{ flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, borderRadius:16, height:52, borderWidth:1, borderColor:'#E8ECF0', backgroundColor:'#FFFFFF' },
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
  hero:{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', backgroundColor:'#FFFFFF', borderRadius:20, padding:24, borderWidth:1, borderColor:'#E8ECF0', shadowColor:'#000', shadowOpacity:0.04, shadowRadius:4, shadowOffset:{width:0,height:1}, elevation:2 },
  heroLeft:{ flexDirection:'row', alignItems:'center', gap:16 },
  heroIcon:{ width:62, height:62, borderRadius:16, backgroundColor:'#F5F7FA', alignItems:'center', justifyContent:'center' },
  heroTitle:{ fontSize:22, fontWeight:'800', color:'#1A1D21', lineHeight:28 },
  heroSub:{ fontSize:14, color:'#6B7280', marginTop:4, maxWidth:360, lineHeight:20 },
  heroBadge:{ flexDirection:'row', alignItems:'center', gap:8, backgroundColor:'#E1F5EE', paddingHorizontal:14, paddingVertical:8, borderRadius:20 },
  heroBadgeTxt:{ fontSize:13, fontWeight:'700', color:'#1D9E75' },
  cardRow:{ flexDirection:'row', gap:20 },
  bigCard:{ flex:1, backgroundColor:'#FFFFFF', borderRadius:20, overflow:'hidden', borderWidth:1, borderColor:'#E8ECF0', shadowColor:'#000', shadowOpacity:0.04, shadowRadius:4, shadowOffset:{width:0,height:1}, elevation:2 },
  bigCardTop:{ alignItems:'center', justifyContent:'center', paddingVertical:36 },
  bigCardBody:{ padding:24, gap:16, flex:1 },
  bigCardTitle:{ fontSize:20, fontWeight:'800', color:'#1A1D21' },
  bigCardDesc:{ fontSize:14, color:'#6B7280', lineHeight:22 },
  bigCardSteps:{ gap:10 },
  stepRow:{ flexDirection:'row', alignItems:'center', gap:10 },
  stepDot:{ width:26, height:26, borderRadius:13, alignItems:'center', justifyContent:'center' },
  stepN:{ fontSize:13, fontWeight:'700', color:'#fff' },
  stepTxt:{ fontSize:14, color:'#6B7280', fontWeight:'500' },
  bigCardBtn:{ flexDirection:'row', alignItems:'center', justifyContent:'center', gap:10, paddingVertical:18 },
  bigCardBtnTxt:{ fontSize:16, fontWeight:'700', color:'#fff' },
});

// ─── Citizen Detail Modal ─────────────────────────────────────
function CitizenDetailModal({ c, reports, actions, onClose }: { c:Citizen; reports:CitizenReport[]; actions:HelpAction[]; onClose:()=>void }) {
  const [selectedItem, setSelectedItem] = useState<{ type: 'report'|'action', id: string } | null>(null);
  const myR = reports.filter(r=>r.citizenId===c.id);
  const myA = actions.filter(a=>a.citizenId===c.id);

  const renderSelectedDetails = () => {
    if (!selectedItem) return null;
    const catColor = selectedItem.type === 'report' ? (CAT_COLORS[myR.find(r=>r.id===selectedItem.id)?.category!] || Colors.category.other) : '#8B5CF6';
    
    if (selectedItem.type === 'report') {
       const r = myR.find(x=>x.id===selectedItem.id)!;
       return (
         <View style={[mu.fcCard, { marginTop:20, marginBottom:0, borderWidth:0, elevation:0 }]}>
            {/* Header */}
            <View style={mu.fcHeader}>
              <View style={[mu.fcAvatar, { backgroundColor: '#1D9E75' }]}>
                <Text style={mu.fcAvatarText}>{c.name.charAt(0)}</Text>
              </View>
              <View style={mu.fcHeaderInfo}>
                <Text style={mu.fcUserName}>{c.name}</Text>
                <View style={mu.fcHeaderMeta}>
                  <Text style={mu.fcTimeAgo}>{r.date}</Text>
                  <View style={mu.fcDot} />
                  <Ionicons name="location-sharp" size={12} color="#9CA3AF" />
                  <Text style={mu.fcLocationSmall} numberOfLines={1}>Dirección visible bajo autorización</Text>
                </View>
              </View>
              <View style={[mu.fcStatusBadge, { backgroundColor: Colors.status.verified }]}>
                <Text style={[mu.fcStatusText, { color: Colors.status.verifiedText }]}>Verificado</Text>
              </View>
            </View>

            {/* Title + Category */}
            <View style={mu.fcTitleRow}>
              <Text style={mu.fcTitle}>{r.title}</Text>
              <View style={[mu.fcCategoryBadge, { backgroundColor: catColor + '18' }]}>
                <View style={[mu.fcCategoryDot, { backgroundColor: catColor }]} />
                <Text style={[mu.fcCategoryText, { color: catColor }]}>{r.category.toUpperCase()}</Text>
              </View>
            </View>

            {/* Description */}
            <Text style={mu.fcDescription}>{r.description}</Text>

            {/* Image Placeholder */}
            <View style={[mu.fcImageFrame, { borderColor: catColor + '25' }]}> 
              <Image
                source={{ uri: getReferenceImage(r.category, 'report') }}
                style={mu.fcImage}
                resizeMode="cover"
              />
              <View style={mu.fcImageOverlay}>
                <Text style={mu.fcImageOverlayText}>Imagen de referencia (ejemplo)</Text>
              </View>
            </View>

            <View style={{ flexDirection:'row', gap:8, marginTop:8, paddingTop:16, borderTopWidth:1, borderColor:'#F3F4F6', alignItems:'center', justifyContent:'space-between' }}>
              <View style={{ flexDirection:'row', gap:8 }}>
                <EvidencePill has={r.hasEvidence} />
                <RegPill by={r.registeredBy} />
              </View>
            </View>
         </View>
       );
    } else {
       const a = myA.find(x=>x.id===selectedItem.id)!;
       return (
         <View style={[mu.fcCard, { marginTop:20, marginBottom:0, borderWidth:0, elevation:0 }]}>
            {/* Header */}
            <View style={mu.fcHeader}>
              <View style={[mu.fcAvatar, { backgroundColor: '#8B5CF6' }]}>
                <Text style={mu.fcAvatarText}>{c.name.charAt(0)}</Text>
              </View>
              <View style={mu.fcHeaderInfo}>
                <Text style={mu.fcUserName}>{c.name}</Text>
                <View style={mu.fcHeaderMeta}>
                  <Text style={mu.fcTimeAgo}>{a.date}</Text>
                  <View style={mu.fcDot} />
                  <Ionicons name="calendar-outline" size={12} color="#9CA3AF" />
                  <Text style={mu.fcLocationSmall} numberOfLines={1}>Participación ciudadana confirmada</Text>
                </View>
              </View>
              <View style={[mu.fcStatusBadge, { backgroundColor: '#EDE9FE' }]}>
                <Text style={[mu.fcStatusText, { color: '#8B5CF6' }]}>Acción Ayuda</Text>
              </View>
            </View>

            {/* Title + Category */}
            <View style={mu.fcTitleRow}>
              <Text style={mu.fcTitle}>{a.reportTitle}</Text>
              <View style={[mu.fcCategoryBadge, { backgroundColor: '#8B5CF618' }]}>
                <View style={[mu.fcCategoryDot, { backgroundColor: '#8B5CF6' }]} />
                <Text style={[mu.fcCategoryText, { color: '#8B5CF6' }]}>ACCIÓN</Text>
              </View>
            </View>

            {/* Description */}
            <Text style={mu.fcDescription}>{a.description}</Text>

            {/* Image Placeholder */}
            <View style={[mu.fcImageFrame, { borderColor: '#8B5CF625' }]}> 
              <Image
                source={{ uri: getReferenceImage('accion', 'action') }}
                style={mu.fcImage}
                resizeMode="cover"
              />
              <View style={mu.fcImageOverlay}>
                <Text style={mu.fcImageOverlayText}>Imagen de referencia (ejemplo)</Text>
              </View>
            </View>

            <View style={{ flexDirection:'row', gap:8, marginTop:8, paddingTop:16, borderTopWidth:1, borderColor:'#F3F4F6', alignItems:'center', justifyContent:'space-between' }}>
              <View style={{ flexDirection:'row', gap:8 }}>
                <EvidencePill has={a.hasEvidence} />
                <RegPill by={a.registeredBy} />
              </View>
            </View>
         </View>
       );
    }
  };

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
              <Ionicons name="close" size={20} color="#6B7280" />
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
          <ScrollView style={{ maxHeight:340, paddingRight:4 }} showsVerticalScrollIndicator={false}>
            <Text style={mu.secTitle}>📋 Reportes</Text>
            {myR.length===0 && <Text style={mu.empty}>Sin reportes aún</Text>}
            {myR.map(r => (
              <View key={r.id}>
                <TouchableOpacity style={mu.item} onPress={()=>setSelectedItem({type:'report',id:r.id})} activeOpacity={0.7}>
                  <View style={[mu.catDot,{backgroundColor:CAT_COLORS[r.category]||Colors.category.other}]} />
                  <View style={{ flex:1 }}>
                    <Text style={mu.itemTitle} numberOfLines={1}>{r.title}</Text>
                    <Text style={mu.itemSub}>{r.category} · {r.date}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            ))}
            <Text style={[mu.secTitle,{marginTop:22}]}>🤝 Acciones de Ayuda</Text>
            {myA.length===0 && <Text style={mu.empty}>Sin acciones aún</Text>}
            {myA.map(a => (
              <View key={a.id}>
                <TouchableOpacity style={mu.item} onPress={()=>setSelectedItem({type:'action',id:a.id})} activeOpacity={0.7}>
                  <View style={[mu.catDot,{backgroundColor:'#8B5CF6'}]} />
                  <View style={{ flex:1 }}>
                    <Text style={mu.itemTitle} numberOfLines={1}>{a.description}</Text>
                    <Text style={mu.itemSub}>↳ Muro: {a.reportTitle} · {a.date}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* --- SECONDARY OVERLAY FOR DETAILS --- */}
        {selectedItem && (
          <View style={[StyleSheet.absoluteFill, mu.overlayOverlay]}>
             <View style={[mu.overlayCard]}>
               <TouchableOpacity style={mu.overlayCloseBtn} onPress={()=>setSelectedItem(null)}>
                 <Ionicons name="close" size={24} color="#6B7280" />
               </TouchableOpacity>
               <ScrollView showsVerticalScrollIndicator={false}>
                 {renderSelectedDetails()}
               </ScrollView>
             </View>
          </View>
        )}
      </View>
    </Modal>
  );
}
const mu = StyleSheet.create({
  overlay:{ flex:1, backgroundColor:'rgba(0,0,0,0.3)', justifyContent:'center', alignItems:'center' },
  card:{ backgroundColor:'#FFFFFF', borderRadius:24, padding:28, width:'90%', maxWidth:580, shadowColor:'#000', shadowOpacity:0.15, shadowRadius:24, shadowOffset:{width:0,height:8}, elevation:10 },
  header:{ flexDirection:'row', alignItems:'center', gap:16, marginBottom:16 },
  avatarLg:{ width:60, height:60, borderRadius:30, backgroundColor:'#1D9E75', alignItems:'center', justifyContent:'center' },
  avatarLgTxt:{ fontSize:24, fontWeight:'700', color:'#fff' },
  name:{ fontSize:20, fontWeight:'800', color:'#1A1D21' },
  email:{ fontSize:14, color:'#6B7280', marginTop:2 },
  closeX:{ width:36, height:36, borderRadius:18, backgroundColor:'#F5F7FA', alignItems:'center', justifyContent:'center' },
  badge:{ flexDirection:'row', alignItems:'center', gap:6, paddingHorizontal:12, paddingVertical:6, borderRadius:16, borderWidth:1 },
  badgeTxt:{ fontSize:13, fontWeight:'700' },
  statsRow:{ flexDirection:'row', gap:12, marginBottom:20 },
  statBox:{ flex:1, backgroundColor:'#F5F7FA', borderRadius:16, padding:14, alignItems:'center', borderWidth:1, borderColor:'#E8ECF0' },
  statNum:{ fontSize:24, fontWeight:'800', color:'#1A1D21' },
  statLabel:{ fontSize:12, color:'#6B7280', fontWeight:'600', marginTop:2, textAlign:'center' },
  secTitle:{ fontSize:12, fontWeight:'700', color:'#9CA3AF', textTransform:'uppercase', letterSpacing:0.6, marginBottom:10 },
  item:{ flexDirection:'row', alignItems:'center', gap:12, paddingVertical:13, borderBottomWidth:1, borderBottomColor:'#E8ECF0' },
  catDot:{ width:10, height:10, borderRadius:5, flexShrink:0 },
  itemTitle:{ fontSize:15, fontWeight:'700', color:'#1A1D21' },
  itemSub:{ fontSize:13, color:'#6B7280', marginTop:3 },
  empty:{ fontSize:14, color:'#9CA3AF', fontStyle:'italic', marginBottom:12 },
  
  // FeedCard clone layout
  fcCard: { backgroundColor:'#FFFFFF', borderRadius:16, marginTop:8, marginBottom:16, borderWidth:1, borderColor:'#E8ECF0', padding:16, shadowColor:'#000', shadowOffset:{width:0,height:1}, shadowOpacity:0.04, shadowRadius:6, elevation:1 },
  fcHeader: { flexDirection:'row', alignItems:'center', marginBottom:16 },
  fcAvatar: { width:40, height:40, borderRadius:20, alignItems:'center', justifyContent:'center', marginRight:12 },
  fcAvatarText: { color:'#FFFFFF', fontSize:16, fontWeight:'700' },
  fcHeaderInfo: { flex:1, paddingRight:8 },
  fcUserName: { fontSize:15, fontWeight:'700', color:'#1A1D21', marginBottom:2 },
  fcHeaderMeta: { flexDirection:'row', alignItems:'center' },
  fcTimeAgo: { fontSize:12, color:'#6B7280' },
  fcDot: { width:3, height:3, borderRadius:1.5, backgroundColor:'#D1D5DB', marginHorizontal:6 },
  fcLocationSmall: { fontSize:12, color:'#9CA3AF', flex:1, marginLeft:2 },
  fcStatusBadge: { paddingHorizontal:10, paddingVertical:4, borderRadius:12 },
  fcStatusText: { fontSize:11, fontWeight:'700' },
  fcTitleRow: { flexDirection:'row', alignItems:'flex-start', justifyContent:'space-between', marginBottom:8 },
  fcTitle: { flex:1, fontSize:16, fontWeight:'800', color:'#1A1D21', marginRight:12, lineHeight:22 },
  fcCategoryBadge: { flexDirection:'row', alignItems:'center', paddingHorizontal:8, paddingVertical:4, borderRadius:8 },
  fcCategoryDot: { width:6, height:6, borderRadius:3, marginRight:6 },
  fcCategoryText: { fontSize:11, fontWeight:'700' },
  fcDescription: { fontSize:15, color:'#4B5563', lineHeight:24, marginBottom:20 },
  fcImageFrame: { height:280, borderRadius:16, overflow:'hidden', marginBottom:16, borderWidth:1 },
  fcImage: { width:'100%', height:'100%' },
  fcImageOverlay: {
    position:'absolute',
    left:12,
    right:12,
    bottom:12,
    borderRadius:10,
    backgroundColor:'rgba(17,24,39,0.55)',
    paddingHorizontal:10,
    paddingVertical:7,
    alignSelf:'flex-start',
  },
  fcImageOverlayText: { color:'#FFFFFF', fontSize:12, fontWeight:'700' },
  
  // Secondary overlay for expanded details
  overlayOverlay: { backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', zIndex: 999 },
  overlayCard: { backgroundColor: '#FFFFFF', width: '95%', maxWidth: 750, maxHeight: '95%', borderRadius: 24, padding: 32, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 32, shadowOffset: { width:0, height:16 }, elevation: 20 },
  overlayCloseBtn: { position: 'absolute', top: 16, right: 16, zIndex: 10, width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
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
  searchBox:{ flexDirection:'row', alignItems:'center', gap:12, backgroundColor:'#FFFFFF', borderRadius:16, borderWidth:1, borderColor:'#E8ECF0', paddingHorizontal:16, height:52, marginBottom:16 },
  searchInput:{ flex:1, fontSize:15, color:'#1A1D21' },
  card:{ flexDirection:'row', alignItems:'center', gap:14, backgroundColor:'#FFFFFF', borderRadius:20, padding:18, borderWidth:1, borderColor:'#E8ECF0', shadowColor:'#000', shadowOpacity:0.04, shadowRadius:4, shadowOffset:{width:0,height:1}, elevation:2 },
  avatar:{ width:52, height:52, borderRadius:26, backgroundColor:'#E1F5EE', alignItems:'center', justifyContent:'center' },
  avatarTxt:{ fontSize:20, fontWeight:'700', color:'#1D9E75' },
  name:{ fontSize:16, fontWeight:'700', color:'#1A1D21' },
  email:{ fontSize:13, color:'#6B7280', marginTop:2 },
  statChip:{ flexDirection:'row', alignItems:'center', gap:5, backgroundColor:'#F5F7FA', paddingHorizontal:10, paddingVertical:6, borderRadius:20 },
  statTxt:{ fontSize:14, fontWeight:'700' },
  arrowBox:{ width:36, height:36, borderRadius:18, backgroundColor:'#F5F7FA', alignItems:'center', justifyContent:'center' },
});

function RecordDetailModal({
  report,
  action,
  covered,
  coveredByName,
  onPressCovered,
  onClose,
}: {
  report?: CitizenReport | null;
  action?: HelpAction | null;
  covered?: boolean;
  coveredByName?: string | null;
  onPressCovered?: () => void;
  onClose: () => void;
}) {
  const isReport = !!report;
  const category = isReport ? report!.category : 'Acción de ayuda';
  const catColor = isReport ? (CAT_COLORS[report!.category] || Colors.category.other) : '#8B5CF6';
  const title = isReport ? report!.title : action!.reportTitle;
  const description = isReport ? report!.description : action!.description;
  const citizenName = isReport ? report!.citizenName : action!.citizenName;
  const date = isReport ? report!.date : action!.date;
  const hasEvidence = isReport ? report!.hasEvidence : action!.hasEvidence;
  const registeredBy = isReport ? report!.registeredBy : action!.registeredBy;
  const isCovered = isReport ? !!covered : true;

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <View style={rd.overlay}>
        <View style={rd.card}>
          <TouchableOpacity style={rd.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={20} color="#6B7280" />
          </TouchableOpacity>

          <View style={rd.headerRow}>
            <View style={[rd.avatar, { backgroundColor: isReport ? Colors.primary : '#8B5CF6' }]}>
              <Text style={rd.avatarText}>{citizenName.charAt(0)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={rd.citizenName}>{citizenName}</Text>
              <View style={rd.metaRow}>
                <Text style={rd.metaText}>{date}</Text>
                <View style={rd.dot} />
                <Text style={rd.metaText}>{isReport ? 'Reporte' : 'Acción'}</Text>
              </View>
            </View>
            <View style={[rd.categoryChip, { backgroundColor: catColor + '18' }]}> 
              <View style={[rd.categoryDot, { backgroundColor: catColor }]} />
              <Text style={[rd.categoryText, { color: catColor }]} numberOfLines={1}>{category}</Text>
            </View>
          </View>

          <Text style={rd.title}>{title}</Text>
          <Text style={rd.description}>{description}</Text>

          <View style={[rd.imageFrame, { borderColor: catColor + '25' }]}>
            <Image
              source={{ uri: getReferenceImage(category, isReport ? 'report' : 'action') }}
              style={rd.image}
              resizeMode="cover"
            />
            <View style={rd.imageOverlay}>
              <Text style={rd.imageOverlayText}>Imagen de referencia (ejemplo)</Text>
            </View>
          </View>

          <View style={rd.footerPills}>
            {isReport ? (
              <TouchableOpacity onPress={onPressCovered} disabled={!onPressCovered} activeOpacity={0.8}>
                <CoveredPillLg covered={isCovered} byName={coveredByName} />
              </TouchableOpacity>
            ) : null}
            <EvidencePillLg has={hasEvidence} />
            <RegPillLg by={registeredBy} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const rd = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.42)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 900,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: '#E8ECF0',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    paddingRight: 56,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  citizenName: { fontSize: 18, fontWeight: '800', color: '#1A1D21' },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  metaText: { fontSize: 13, color: '#6B7280' },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: '#9CA3AF', marginHorizontal: 6 },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    maxWidth: 210,
    marginLeft: 8,
    flexShrink: 1,
  },
  categoryDot: { width: 8, height: 8, borderRadius: 4 },
  categoryText: { fontSize: 13, fontWeight: '700' },
  title: { fontSize: 30, fontWeight: '900', color: '#1A1D21', marginBottom: 10, letterSpacing: -0.5 },
  description: { fontSize: 17, color: '#4B5563', lineHeight: 25, marginBottom: 16 },
  imageFrame: {
    height: 340,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  imageOverlay: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: 'rgba(17,24,39,0.56)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    alignSelf: 'flex-start',
  },
  imageOverlayText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  footerPills: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
});

const mdl = StyleSheet.create({
  pillLg: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  pillLgText: {
    fontSize: 13,
    fontWeight: '700',
  },
});

// ─── Table helpers ────────────────────────────────────────────
function ReportesSection({ reports, actions }: { reports:CitizenReport[]; actions:HelpAction[] }) {
  const [selectedReport, setSelectedReport] = useState<CitizenReport | null>(null);
  const [selectedCoveredAction, setSelectedCoveredAction] = useState<HelpAction | null>(null);
  const [search, setSearch] = useState('');
  const { width } = useWindowDimensions();

  const columns = width >= 1350 ? 3 : width >= 980 ? 2 : 1;
  const cardWidth = columns === 3 ? '32%' : columns === 2 ? '49%' : '100%';

  const getCoveringAction = (report: CitizenReport) =>
    actions.find((a) => a.reportId === report.id || a.reportTitle === report.title) ?? null;

  const isReportCovered = (report: CitizenReport) => !!getCoveringAction(report);

  const filteredReports = reports.filter((r) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const haystack = [
      r.title,
      r.citizenName,
      r.category,
      r.description,
      r.location ?? '',
      r.date,
      getCoveringAction(r)?.citizenName ?? '',
      isReportCovered(r) ? 'cubierto' : 'sin cubrir',
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });

  return (
    <>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom:40 }}>
        <View style={lc.searchBox}>
          <Ionicons name="search" size={18} color={Colors.textMuted} />
          <TextInput
            style={lc.searchInput}
            placeholder="Buscar por título, ciudadano, categoría, ubicación..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={lc.grid}>
          {filteredReports.map((r) => {
            const catColor = CAT_COLORS[r.category] || Colors.category.other;
            const coveringAction = getCoveringAction(r);
            const covered = !!coveringAction;
            return (
              <TouchableOpacity key={r.id} style={[lc.card, { width: cardWidth }]} onPress={() => setSelectedReport(r)} activeOpacity={0.88}>
                <View style={lc.topRow}>
                  <View style={lc.titleWrap}>
                    <View style={[lc.catDot, { backgroundColor: catColor }]} />
                    <Text style={lc.title} numberOfLines={1}>{r.title}</Text>
                  </View>
                  <View style={[lc.categoryChip, { backgroundColor: catColor + '18' }]}>
                    <Text style={[lc.categoryText, { color: catColor }]}>{r.category}</Text>
                  </View>
                </View>

                <Text style={lc.desc} numberOfLines={2}>{r.description}</Text>

                <View style={[lc.thumbWrap, { borderColor: catColor + '30' }]}> 
                  <Image
                    source={{ uri: getReferenceImage(r.category, 'report') }}
                    style={lc.thumbImage}
                    resizeMode="cover"
                  />
                </View>

                <View style={lc.metaRow}>
                  <View style={lc.metaItem}>
                    <Ionicons name="person-outline" size={13} color={Colors.textMuted} />
                    <Text style={lc.metaText}>{r.citizenName}</Text>
                  </View>
                  <View style={lc.metaItem}>
                    <Ionicons name="location-outline" size={13} color={Colors.textMuted} />
                    <Text style={lc.metaText} numberOfLines={1}>{r.location ?? 'Sin ubicación'}</Text>
                  </View>
                  <View style={lc.metaItem}>
                    <Ionicons name="calendar-outline" size={13} color={Colors.textMuted} />
                    <Text style={lc.metaText}>{r.date}</Text>
                  </View>
                </View>

                <View style={lc.pillsRow}>
                  {covered && coveringAction ? (
                    <TouchableOpacity
                      style={lc.coveredLinkPill}
                      onPress={() => setSelectedCoveredAction(coveringAction)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="checkmark-done-circle" size={14} color="#166534" />
                      <Text style={lc.coveredLinkText} numberOfLines={1}>
                        Cubierto por {coveringAction.citizenName}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <CoveredPillLg covered={false} />
                  )}
                  <EvidencePill has={r.hasEvidence} />
                  <RegPill by={r.registeredBy} />
                </View>
              </TouchableOpacity>
            );
          })}

          {filteredReports.length === 0 && (
            <View style={lc.emptyWrap}>
              <Ionicons name="search" size={22} color={Colors.textMuted} />
              <Text style={lc.emptyText}>No se encontraron reportes con ese criterio</Text>
            </View>
          )}
        </View>
      </ScrollView>
      {selectedReport && (
        <RecordDetailModal
          report={selectedReport}
          covered={isReportCovered(selectedReport)}
          coveredByName={getCoveringAction(selectedReport)?.citizenName ?? null}
          onPressCovered={() => {
            const covering = getCoveringAction(selectedReport);
            if (!covering) return;
            setSelectedReport(null);
            setSelectedCoveredAction(covering);
          }}
          onClose={() => setSelectedReport(null)}
        />
      )}
      {selectedCoveredAction && (
        <RecordDetailModal
          action={selectedCoveredAction}
          onClose={() => setSelectedCoveredAction(null)}
        />
      )}
    </>
  );
}
function AccionesSection({ actions }: { actions:HelpAction[] }) {
  const [selectedAction, setSelectedAction] = useState<HelpAction | null>(null);
  const [search, setSearch] = useState('');
  const { width } = useWindowDimensions();

  const columns = width >= 1350 ? 3 : width >= 980 ? 2 : 1;
  const cardWidth = columns === 3 ? '32%' : columns === 2 ? '49%' : '100%';

  const filteredActions = actions.filter((a) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const haystack = [
      a.citizenName,
      a.reportTitle,
      a.description,
      a.location ?? '',
      a.date,
      a.hasEvidence ? 'con evidencia' : 'sin evidencia',
      a.registeredBy === 'institution' ? 'institucion' : 'movil',
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });

  return (
    <>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom:40 }}>
        <View style={lc.searchBox}>
          <Ionicons name="search" size={18} color={Colors.textMuted} />
          <TextInput
            style={lc.searchInput}
            placeholder="Buscar por ciudadano, reporte, ubicación o texto..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={lc.grid}>
          {filteredActions.map((a) => (
            <TouchableOpacity key={a.id} style={[lc.card, { width: cardWidth }]} onPress={() => setSelectedAction(a)} activeOpacity={0.88}>
              <View style={lc.topRow}>
                <View style={lc.titleWrap}>
                  <View style={[lc.catDot, { backgroundColor: '#8B5CF6' }]} />
                  <Text style={lc.title} numberOfLines={1}>{a.reportTitle}</Text>
                </View>
                <View style={[lc.categoryChip, { backgroundColor: '#8B5CF618' }]}>
                  <Text style={[lc.categoryText, { color: '#8B5CF6' }]}>Acción de ayuda</Text>
                </View>
              </View>

              <Text style={lc.desc} numberOfLines={2}>{a.description}</Text>

              <View style={[lc.thumbWrap, { borderColor: '#8B5CF630' }]}> 
                <Image
                  source={{ uri: getReferenceImage('accion', 'action') }}
                  style={lc.thumbImage}
                  resizeMode="cover"
                />
              </View>

              <View style={lc.metaRow}>
                <View style={lc.metaItem}>
                  <Ionicons name="person-outline" size={13} color={Colors.textMuted} />
                  <Text style={lc.metaText}>{a.citizenName}</Text>
                </View>
                <View style={lc.metaItem}>
                  <Ionicons name="location-outline" size={13} color={Colors.textMuted} />
                  <Text style={lc.metaText} numberOfLines={1}>{a.location ?? 'Sin ubicación'}</Text>
                </View>
                <View style={lc.metaItem}>
                  <Ionicons name="calendar-outline" size={13} color={Colors.textMuted} />
                  <Text style={lc.metaText}>{a.date}</Text>
                </View>
              </View>

              <View style={lc.pillsRow}>
                <EvidencePill has={a.hasEvidence} />
                <RegPill by={a.registeredBy} />
              </View>
            </TouchableOpacity>
          ))}

          {filteredActions.length === 0 && (
            <View style={lc.emptyWrap}>
              <Ionicons name="search" size={22} color={Colors.textMuted} />
              <Text style={lc.emptyText}>No se encontraron acciones de ayuda</Text>
            </View>
          )}
        </View>
      </ScrollView>
      {selectedAction && <RecordDetailModal action={selectedAction} onClose={() => setSelectedAction(null)} />}
    </>
  );
}
const lc = StyleSheet.create({
  searchBox:{ flexDirection:'row', alignItems:'center', gap:10, backgroundColor:'#FFFFFF', borderRadius:14, borderWidth:1, borderColor:'#E8ECF0', paddingHorizontal:14, height:48, marginBottom:14 },
  searchInput:{ flex:1, fontSize:14, color:'#1A1D21' },
  grid:{ flexDirection:'row', flexWrap:'wrap', gap:12, alignItems:'stretch' },
  card:{ backgroundColor:'#FFFFFF', borderRadius:16, padding:14, borderWidth:1, borderColor:'#E8ECF0', shadowColor:'#000', shadowOpacity:0.04, shadowRadius:5, shadowOffset:{width:0,height:2}, elevation:2 },
  topRow:{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', gap:10, marginBottom:8 },
  titleWrap:{ flex:1, flexDirection:'row', alignItems:'center', gap:8 },
  catDot:{ width:9, height:9, borderRadius:5, flexShrink:0 },
  title:{ flex:1, fontSize:16, fontWeight:'800', color:'#1A1D21' },
  categoryChip:{ paddingHorizontal:10, paddingVertical:5, borderRadius:999 },
  categoryText:{ fontSize:12, fontWeight:'700' },
  desc:{ fontSize:13, color:'#4B5563', lineHeight:20, marginBottom:10 },
  thumbWrap:{ height:96, borderRadius:12, overflow:'hidden', borderWidth:1, marginBottom:10, backgroundColor:'#F3F4F6' },
  thumbImage:{ width:'100%', height:'100%' },
  metaRow:{ flexDirection:'row', flexWrap:'wrap', gap:10, marginBottom:10 },
  metaItem:{ flexDirection:'row', alignItems:'center', gap:4, maxWidth:'48%' },
  metaText:{ fontSize:12, color:'#6B7280' },
  pillsRow:{ flexDirection:'row', flexWrap:'wrap', gap:8, paddingTop:10, borderTopWidth:1, borderTopColor:'#F3F4F6' },
  coveredLinkPill:{
    maxWidth: 210,
    flexDirection:'row',
    alignItems:'center',
    gap:6,
    backgroundColor:'#DCFCE7',
    borderRadius:999,
    paddingHorizontal:10,
    paddingVertical:6,
  },
  coveredLinkText:{ fontSize:12, fontWeight:'700', color:'#166534', flexShrink:1 },
  emptyWrap:{ width:'100%', backgroundColor:'#FFFFFF', borderRadius:14, borderWidth:1, borderColor:'#E8ECF0', paddingVertical:24, alignItems:'center', justifyContent:'center', gap:8 },
  emptyText:{ fontSize:13, color:'#6B7280', fontWeight:'600' },
});

function DashboardSection({ citizens, reports, actions }: { citizens: Citizen[]; reports: CitizenReport[]; actions: HelpAction[] }) {
  const { width } = useWindowDimensions();
  const stacked = width < 1120;

  const coveredReportIds = new Set(actions.map((a) => a.reportId));
  const coveredReports = reports.filter((r) => coveredReportIds.has(r.id)).length;
  const uncoveredReports = reports.length - coveredReports;
  const coveragePct = reports.length ? Math.round((coveredReports / reports.length) * 100) : 0;

  const totalRecords = reports.length + actions.length;
  const withEvidence = reports.filter((r) => r.hasEvidence).length + actions.filter((a) => a.hasEvidence).length;
  const evidencePct = totalRecords ? Math.round((withEvidence / totalRecords) * 100) : 0;

  const manualRegs = reports.filter((r) => r.registeredBy === 'institution').length + actions.filter((a) => a.registeredBy === 'institution').length;

  const activeCitizenIds = new Set([
    ...reports.map((r) => r.citizenId),
    ...actions.map((a) => a.citizenId),
  ]);
  const participationPct = citizens.length ? Math.round((activeCitizenIds.size / citizens.length) * 100) : 0;

  const parseDate = (d: string) => new Date(`${d}T00:00:00`).getTime();
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const reportsLast7 = reports.filter((r) => parseDate(r.date) >= sevenDaysAgo).length;
  const actionsLast7 = actions.filter((a) => parseDate(a.date) >= sevenDaysAgo).length;

  const wasteReports = reports.filter((r) => ['Basura', 'Electrónicos', 'Orgánico'].includes(r.category)).length;
  const waterRiskReports = reports.filter((r) => r.category === 'Agua').length;
  const wildlifeReports = reports.filter((r) => r.category === 'Fauna').length;

  const estimatedWasteKg = coveredReports * 35 + actions.length * 18;
  const estimatedCo2Kg = Math.round(estimatedWasteKg * 0.38);

  const attentionDays = reports
    .map((r) => {
      const reportDate = parseDate(r.date);
      const related = actions
        .filter((a) => a.reportId === r.id)
        .map((a) => parseDate(a.date))
        .sort((a, b) => a - b);
      if (related.length === 0) return null;
      const diff = Math.max(0, Math.round((related[0] - reportDate) / (1000 * 60 * 60 * 24)));
      return diff;
    })
    .filter((n): n is number => n !== null);

  const avgAttentionDays = attentionDays.length
    ? Number((attentionDays.reduce((sum, n) => sum + n, 0) / attentionDays.length).toFixed(1))
    : 0;

  const zoneCount = [...reports, ...actions]
    .map((item: any) => (item.location ?? 'Sin ubicación').split(',')[0].trim())
    .reduce<Record<string, number>>((acc, zone) => {
      acc[zone] = (acc[zone] ?? 0) + 1;
      return acc;
    }, {});

  const hotZones = Object.entries(zoneCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const categoryCounts = reports.reduce<Record<string, number>>((acc, r) => {
    acc[r.category] = (acc[r.category] ?? 0) + 1;
    return acc;
  }, {});

  const topCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const recentActivity = [
    ...reports.map((r) => ({ id: `r-${r.id}`, date: r.date, label: r.title, type: 'Reporte', color: Colors.accent })),
    ...actions.map((a) => ({ id: `a-${a.id}`, date: a.date, label: a.reportTitle, type: 'Acción', color: '#8B5CF6' })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8);

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={ds.wrap}>
      <View style={[ds.heroRow, stacked && ds.heroRowStacked]}>
        <View style={[ds.heroCard, ds.heroCardPrimary, stacked && ds.heroCardStacked]}>
          <View style={ds.heroIconWrap}>
            <Ionicons name="leaf" size={22} color="#1D9E75" />
          </View>
          <Text style={ds.heroTitle}>Impacto ambiental estimado</Text>
          <Text style={ds.heroValue}>{estimatedWasteKg} kg</Text>
          <Text style={ds.heroSub}>de residuos recuperados por atención ciudadana</Text>
          <View style={ds.heroInlineStats}>
            <View style={ds.heroMiniPill}><Text style={ds.heroMiniPillText}>CO2 evitado: {estimatedCo2Kg} kg</Text></View>
            <View style={ds.heroMiniPill}><Text style={ds.heroMiniPillText}>Cobertura: {coveragePct}%</Text></View>
          </View>
        </View>

        <View style={[ds.heroCard, ds.heroCardSecondary, stacked && ds.heroCardStacked]}>
          <View style={ds.heroIconWrapSecondary}>
            <Ionicons name="people" size={22} color="#3B82F6" />
          </View>
          <Text style={ds.heroTitle}>Movilización comunitaria</Text>
          <Text style={ds.heroValue}>{participationPct}%</Text>
          <Text style={ds.heroSub}>de ciudadanos participando activamente</Text>
          <View style={ds.heroInlineStats}>
            <View style={[ds.heroMiniPill, ds.heroMiniPillBlue]}><Text style={ds.heroMiniPillTextBlue}>+{reportsLast7} reportes (7d)</Text></View>
            <View style={[ds.heroMiniPill, ds.heroMiniPillBlue]}><Text style={ds.heroMiniPillTextBlue}>+{actionsLast7} acciones (7d)</Text></View>
          </View>
        </View>
      </View>

      <View style={ds.kpiGrid}>
        <View style={ds.kpiCardLarge}>
          <View style={ds.kpiHead}><Ionicons name="alert-circle" size={18} color={Colors.accent} /><Text style={ds.kpiLabel}>Reportes totales</Text></View>
          <Text style={ds.kpiValue}>{reports.length}</Text>
        </View>
        <View style={ds.kpiCardLarge}>
          <View style={ds.kpiHead}><Ionicons name="hand-right" size={18} color="#8B5CF6" /><Text style={ds.kpiLabel}>Acciones de ayuda</Text></View>
          <Text style={ds.kpiValue}>{actions.length}</Text>
        </View>
        <View style={ds.kpiCardLarge}>
          <View style={ds.kpiHead}><Ionicons name="people" size={18} color="#3B82F6" /><Text style={ds.kpiLabel}>Ciudadanos activos</Text></View>
          <Text style={ds.kpiValue}>{activeCitizenIds.size} / {citizens.length}</Text>
        </View>
        <View style={ds.kpiCardLarge}>
          <View style={ds.kpiHead}><Ionicons name="business" size={18} color={Colors.primary} /><Text style={ds.kpiLabel}>Registros manuales</Text></View>
          <Text style={ds.kpiValue}>{manualRegs}</Text>
        </View>
      </View>

      <View style={[ds.envGrid, stacked && ds.envGridStacked]}>
        <View style={ds.envCard}>
          <View style={ds.envHeader}><Ionicons name="trash" size={18} color={Colors.category.trash} /><Text style={ds.envTitle}>Residuos y limpieza</Text></View>
          <Text style={ds.envValue}>{wasteReports}</Text>
          <Text style={ds.envSub}>reportes relacionados con basura, orgánicos y electrónicos</Text>
        </View>
        <View style={ds.envCard}>
          <View style={ds.envHeader}><Ionicons name="water" size={18} color={Colors.category.drain} /><Text style={ds.envTitle}>Riesgo hídrico</Text></View>
          <Text style={ds.envValue}>{waterRiskReports}</Text>
          <Text style={ds.envSub}>incidencias de agua y drenaje detectadas</Text>
        </View>
        <View style={ds.envCard}>
          <View style={ds.envHeader}><Ionicons name="paw" size={18} color={Colors.category.wildlife} /><Text style={ds.envTitle}>Fauna y biodiversidad</Text></View>
          <Text style={ds.envValue}>{wildlifeReports}</Text>
          <Text style={ds.envSub}>alertas ambientales relacionadas con fauna</Text>
        </View>
      </View>

      <View style={[ds.row, stacked && ds.rowStacked]}>
        <View style={ds.panel}>
          <Text style={ds.panelTitle}>Cobertura del programa</Text>
          <View style={ds.progressTrack}>
            <View style={[ds.progressFill, { width: `${coveragePct}%` }]} />
          </View>
          <Text style={ds.progressText}>{coveragePct}% de reportes cubiertos ({coveredReports}/{reports.length})</Text>
          <View style={ds.splitRow}>
            <View style={ds.splitItem}><Text style={ds.splitLabel}>Cubiertos</Text><Text style={ds.splitValue}>{coveredReports}</Text></View>
            <View style={ds.splitItem}><Text style={ds.splitLabel}>Pendientes</Text><Text style={ds.splitValue}>{uncoveredReports}</Text></View>
          </View>
        </View>

        <View style={ds.panel}>
          <Text style={ds.panelTitle}>Calidad de evidencia y atención</Text>
          <View style={ds.progressTrackSecondary}>
            <View style={[ds.progressFillSecondary, { width: `${evidencePct}%` }]} />
          </View>
          <Text style={ds.progressText}>{evidencePct}% de registros con evidencia ({withEvidence}/{totalRecords})</Text>
          <Text style={ds.helper}>Tiempo promedio de atención: {avgAttentionDays} días.</Text>
        </View>
      </View>

      <View style={[ds.row, stacked && ds.rowStacked]}>
        <View style={ds.panel}>
          <Text style={ds.panelTitle}>Top categorías reportadas</Text>
          {topCategories.length === 0 ? (
            <Text style={ds.empty}>Sin datos aún.</Text>
          ) : (
            topCategories.map(([cat, count]) => {
              const max = topCategories[0][1] || 1;
              const pct = Math.max(8, Math.round((count / max) * 100));
              const color = CAT_COLORS[cat] || Colors.category.other;
              return (
                <View key={cat} style={ds.catRow}>
                  <Text style={ds.catLabel}>{cat}</Text>
                  <View style={ds.catTrack}><View style={[ds.catFill, { width: `${pct}%`, backgroundColor: color }]} /></View>
                  <Text style={ds.catCount}>{count}</Text>
                </View>
              );
            })
          )}
        </View>

        <View style={ds.panel}>
          <Text style={ds.panelTitle}>Actividad reciente y zonas críticas</Text>
          <View style={ds.hotZonesWrap}>
            {hotZones.map(([zone, count]) => (
              <View key={zone} style={ds.hotZonePill}>
                <Ionicons name="location" size={13} color="#B45309" />
                <Text style={ds.hotZoneText} numberOfLines={1}>{zone} ({count})</Text>
              </View>
            ))}
          </View>
          {recentActivity.length === 0 ? (
            <Text style={ds.empty}>Sin actividad reciente.</Text>
          ) : (
            recentActivity.map((item) => (
              <View key={item.id} style={ds.activityRow}>
                <View style={[ds.activityDot, { backgroundColor: item.color }]} />
                <View style={{ flex: 1 }}>
                  <Text style={ds.activityLabel} numberOfLines={1}>{item.label}</Text>
                  <Text style={ds.activityMeta}>{item.type} · {item.date}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const ds = StyleSheet.create({
  wrap: { paddingBottom: 40, gap: 14 },
  heroRow: { flexDirection: 'row', gap: 12 },
  heroRowStacked: { flexDirection: 'column' },
  heroCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    minHeight: 165,
  },
  heroCardPrimary: { backgroundColor: '#F3FBF8', borderColor: '#D2EEE3' },
  heroCardSecondary: { backgroundColor: '#F2F7FF', borderColor: '#DBE9FF' },
  heroCardStacked: { minHeight: 150 },
  heroIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#DDF5EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  heroIconWrapSecondary: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#DCEAFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  heroTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  heroValue: { fontSize: 38, fontWeight: '800', color: '#111827', marginTop: 4, lineHeight: 44 },
  heroSub: { fontSize: 13, color: '#4B5563', marginTop: 2 },
  heroInlineStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  heroMiniPill: { backgroundColor: '#E4F4EE', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  heroMiniPillBlue: { backgroundColor: '#E6EFFF' },
  heroMiniPillText: { fontSize: 13, fontWeight: '700', color: '#166534' },
  heroMiniPillTextBlue: { fontSize: 13, fontWeight: '700', color: '#1D4ED8' },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  kpiCardLarge: {
    width: '24%',
    minWidth: 180,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8ECF0',
    padding: 16,
  },
  kpiHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  kpiLabel: { fontSize: 13, fontWeight: '700', color: '#6B7280' },
  kpiValue: { fontSize: 28, fontWeight: '800', color: '#111827', marginTop: 8 },
  envGrid: { flexDirection: 'row', gap: 12 },
  envGridStacked: { flexDirection: 'column' },
  envCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8ECF0',
    padding: 16,
    minHeight: 132,
  },
  envHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  envTitle: { fontSize: 16, fontWeight: '800', color: '#1F2937' },
  envValue: { fontSize: 32, fontWeight: '800', color: '#111827', marginTop: 6 },
  envSub: { fontSize: 13, color: '#6B7280', marginTop: 2, lineHeight: 19 },
  row: { flexDirection: 'row', gap: 12, alignItems: 'stretch' },
  rowStacked: { flexDirection: 'column' },
  panel: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8ECF0',
    padding: 16,
    minHeight: 210,
  },
  panelTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 14 },
  progressTrack: { height: 12, borderRadius: 999, backgroundColor: '#E5F3EF', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#1D9E75' },
  progressTrackSecondary: { height: 12, borderRadius: 999, backgroundColor: '#E7EDFA', overflow: 'hidden' },
  progressFillSecondary: { height: '100%', backgroundColor: '#3B82F6' },
  progressText: { marginTop: 10, fontSize: 14, color: '#4B5563', fontWeight: '600' },
  helper: { marginTop: 6, fontSize: 13, color: '#6B7280' },
  splitRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  splitItem: { flex: 1, backgroundColor: '#F8FAFC', borderRadius: 12, padding: 10 },
  splitLabel: { fontSize: 13, color: '#6B7280' },
  splitValue: { fontSize: 18, fontWeight: '800', color: '#111827', marginTop: 2 },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  catLabel: { width: 110, fontSize: 14, fontWeight: '600', color: '#374151' },
  catTrack: { flex: 1, height: 9, borderRadius: 999, backgroundColor: '#F1F5F9', overflow: 'hidden' },
  catFill: { height: '100%', borderRadius: 999 },
  catCount: { width: 24, textAlign: 'right', fontSize: 14, fontWeight: '700', color: '#111827' },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  activityDot: { width: 9, height: 9, borderRadius: 5 },
  activityLabel: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  activityMeta: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  hotZonesWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  hotZonePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEF3C7',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    maxWidth: 220,
  },
  hotZoneText: { fontSize: 13, fontWeight: '700', color: '#92400E' },
  empty: { fontSize: 14, color: '#6B7280' },
});

// ─── Root Screen ─────────────────────────────────────────────
export default function AdminScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [section, setSection] = useState<Section>('dashboard');
  const [reports, setReports] = useState<CitizenReport[]>(SEED_REPORTS);
  const [actions, setActions] = useState<HelpAction[]>(SEED_ACTIONS);

  const addReport = (d: Omit<CitizenReport,'id'>) => setReports(p=>[{id:`rp${Date.now()}`,...d},...p]);
  const addAction = (d: Omit<HelpAction,'id'>)   => setActions(p=>[{id:`ha${Date.now()}`,...d},...p]);

  const TITLES: Record<Section,string> = {
    dashboard:'Dashboard del Programa',
    registrar:'Registro Manual',
    ciudadanos:'Ciudadanos',
    reportes:'Reportes',
    acciones:'Acciones de Ayuda',
  };

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
              <TouchableOpacity key={item.id} style={[s.navItem, active&&{backgroundColor:item.color+'12'}]} onPress={()=>setSection(item.id)}>
                <View style={[s.navIconBox, {backgroundColor: active?item.color+'18':'#F5F7FA'}]}>
                  <Ionicons name={item.icon as any} size={20} color={active?item.color:'#9CA3AF'} />
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

        <TouchableOpacity style={s.logoutBtn} onPress={()=>{ router.replace('/login' as any); }}>
          <Ionicons name="log-out-outline" size={20} color="rgba(255,255,255,0.75)" />
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
          {section==='dashboard'  && <DashboardSection citizens={CITIZENS} reports={reports} actions={actions} />}
          {section==='registrar'  && <RegistrarSection citizens={CITIZENS} reports={reports} onSaveReport={addReport} onSaveAction={addAction} />}
          {section==='ciudadanos' && <CiudadanosSection citizens={CITIZENS} reports={reports} actions={actions} />}
          {section==='reportes'   && <ReportesSection  reports={reports} actions={actions} />}
          {section==='acciones'   && <AccionesSection  actions={actions} />}
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:{ flex:1, flexDirection:'row', backgroundColor:'#F5F7FA' },
  // ── Sidebar ── Minimalist white panel
  sidebar:{ width:SIDEBAR_W, backgroundColor:'#FFFFFF', paddingHorizontal:16, paddingVertical:20, gap:4, borderRightWidth:1, borderRightColor:'#E8ECF0' },
  brand:{ flexDirection:'row', alignItems:'center', gap:12, marginBottom:24, paddingBottom:20, borderBottomWidth:1, borderBottomColor:'#E8ECF0' },
  brandLogo:{ width:46, height:46, borderRadius:14, backgroundColor:'#1D9E75', alignItems:'center', justifyContent:'center' },
  brandName:{ fontSize:16, fontWeight:'800', color:'#1A1D21' },
  brandRole:{ fontSize:12, color:'#6B7280', fontWeight:'500', marginTop:2 },
  navGroup:{ fontSize:11, fontWeight:'700', color:'#9CA3AF', letterSpacing:1, marginBottom:10, marginLeft:4, marginTop:10 },
  navItem:{ flexDirection:'row', alignItems:'center', gap:12, paddingVertical:12, paddingHorizontal:12, borderRadius:16, marginBottom:4 },
  navIconBox:{ width:38, height:38, borderRadius:12, alignItems:'center', justifyContent:'center' },
  navLabel:{ fontSize:14, color:'#6B7280', fontWeight:'600', flex:1 },
  navDot:{ width:6, height:6, borderRadius:3 },
  summaryCard:{ backgroundColor:'#F5F7FA', borderRadius:16, padding:16, gap:10, borderWidth:1, borderColor:'#E8ECF0', marginTop:16, marginBottom:12 },
  summaryTitle:{ fontSize:10, fontWeight:'700', color:'#9CA3AF', letterSpacing:1 },
  summaryRow:{ flexDirection:'row', alignItems:'center', gap:8 },
  summaryTxt:{ fontSize:13, color:'#6B7280', fontWeight:'600' },
  logoutBtn:{ flexDirection:'row', alignItems:'center', gap:10, paddingVertical:14, paddingHorizontal:14, backgroundColor:'#FEF2F2', borderRadius:16, marginTop:'auto' },
  logoutTxt:{ fontSize:14, color:'#EF4444', fontWeight:'700' },
  // ── Content area ──
  content:{ flex:1, padding:28 },
  topbar:{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:28 },
  pageTitle:{ fontSize:26, fontWeight:'800', color:'#1A1D21', letterSpacing:-0.5 },
  instBadge:{ flexDirection:'row', alignItems:'center', gap:8, backgroundColor:'#E1F5EE', paddingHorizontal:16, paddingVertical:8, borderRadius:24 },
  instBadgeTxt:{ fontSize:13, fontWeight:'700', color:'#1D9E75' },
});
