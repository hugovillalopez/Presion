import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Modal, 
  ActivityIndicator,
  Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';

// Importación de Firebase
import { db } from '../../firebase';
import { collection, addDoc, deleteDoc, doc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';

SplashScreen.preventAutoHideAsync();

export default function HomeScreen() {
  const [loading, setLoading] = useState(true);
  const [registros, setRegistros] = useState<any[]>([]);
  
  // Estado para el Modal de añadir toma
  const [modalVisible, setModalVisible] = useState(false);
  const [sistolica, setSistolica] = useState('');
  const [diastolica, setDiastolica] = useState('');
  const [pulsaciones, setPulsaciones] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Estados para los acordeones
  const [mesesAbiertos, setMesesAbiertos] = useState<{ [key: string]: boolean }>({});
  const [diasAbiertos, setDiasAbiertos] = useState<{ [key: string]: boolean }>({});

  // Ocultar SplashScreen al cargar
  useEffect(() => {
    async function prepare() {
      await SplashScreen.hideAsync();
    }
    prepare();
    cargarRegistros();
  }, []);

  // Cargar registros desde Firestore
  const cargarRegistros = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, "registros_presion"), orderBy("timestamp", "desc"));
      const querySnapshot = await getDocs(q);
      const lista: any[] = [];
      querySnapshot.forEach((docSnap) => {
        lista.push({ id: docSnap.id, ...docSnap.data() });
      });
      
      setRegistros(lista);

      // Calcular mes y día actual para abrirlos por defecto
      const ahora = new Date();
      const anoActual = ahora.getFullYear();
      const mesNumActual = String(ahora.getMonth() + 1).padStart(2, '0');
      const diaActual = String(ahora.getDate()).padStart(2, '0');

      const nombresMeses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
      const nombreMesActual = `${nombresMeses[parseInt(mesNumActual, 10) - 1]} ${anoActual}`;
      const diaKeyActual = `${nombreMesActual}-${diaActual}`;

      setMesesAbiertos({ [nombreMesActual]: true });
      setDiasAbiertos({ [diaKeyActual]: true });

    } catch (error) {
      console.error("Error al cargar registros:", error);
    } finally {
      setLoading(false);
    }
  };

  // Guardar nueva toma en Firestore
  const guardarMedicion = async () => {
    if (!sistolica || !diastolica) {
      alert("Por favor, introduce al menos la sistólica y la diastólica.");
      return;
    }

    try {
      setGuardando(true);
      const ahora = new Date();
      const fechaStr = ahora.toISOString().split('T')[0]; // "YYYY-MM-DD"
      const horaStr = ahora.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

      const nuevoRegistro = {
        fecha: fechaStr,
        hora: horaStr,
        sistolica: Number(sistolica),
        diastolica: Number(diastolica),
        pulsaciones: pulsaciones ? Number(pulsaciones) : 0,
        timestamp: serverTimestamp()
      };

      await addDoc(collection(db, "registros_presion"), nuevoRegistro);

      // Limpiar y cerrar modal
      setSistolica('');
      setDiastolica('');
      setPulsaciones('');
      setModalVisible(false);
      
      // Recargar lista
      cargarRegistros();
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("Hubo un error al guardar los datos.");
    } finally {
      setGuardando(false);
    }
  };

  // Función para borrar un registro con confirmación
  const confirmarBorrado = (id: string) => {
    Alert.alert(
      "Eliminar medición",
      "¿Estás seguro de que quieres borrar este registro?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Borrar", 
          style: "destructive", 
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "registros_presion", id));
              cargarRegistros(); // Recargar lista tras borrar
            } catch (error) {
              console.error("Error al borrar el registro:", error);
              alert("Hubo un error al eliminar el registro.");
            }
          } 
        }
      ]
    );
  };

  // Agrupar registros por Mes y Día para el acordeón
  const agruparPorMesYDia = () => {
    const agrupado: { [mes: string]: { [dia: string]: any[] } } = {};

    registros.forEach((reg) => {
      if (!reg.fecha) return;
      const [ano, mesNum, dia] = reg.fecha.split('-');
      
      const nombresMeses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
      const nombreMes = `${nombresMeses[parseInt(mesNum, 10) - 1]} ${ano}`;

      if (!agrupado[nombreMes]) agrupado[nombreMes] = {};
      if (!agrupado[nombreMes][dia]) agrupado[nombreMes][dia] = [];

      agrupado[nombreMes][dia].push(reg);
    });

    return agrupado;
  };

  const toggleMes = (mes: string) => {
    setMesesAbiertos(prev => ({ ...prev, [mes]: !prev[mes] }));
  };

  const toggleDia = (key: string) => {
    setDiasAbiertos(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const datosAgrupados = agruparPorMesYDia();

  return (
    <SafeAreaView style={styles.container}>
      {/* Cabecera */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Control de Presión</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.addButtonText}>+ Añadir</Text>
        </TouchableOpacity>
      </View>

      {/* Listado de Acordeones */}
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#d32f2f" />
          <Text style={styles.loadingText}>Cargando registros...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {Object.keys(datosAgrupados).length === 0 ? (
            <Text style={styles.emptyText}>No hay mediciones guardadas todavía. Pulsa "+ Añadir" para empezar.</Text>
          ) : (
            Object.keys(datosAgrupados).map((mes) => {
              const mesAbierto = !!mesesAbiertos[mes];
              return (
                <View key={mes} style={styles.mesContainer}>
                  {/* Botón Mes */}
                  <TouchableOpacity style={styles.mesHeader} onPress={() => toggleMes(mes)}>
                    <Text style={styles.mesTitle}>📅 {mes}</Text>
                    <Text style={styles.arrow}>{mesAbierto ? "▲" : "▼"}</Text>
                  </TouchableOpacity>

                  {/* Días del Mes */}
                  {mesAbierto && (
                    <View style={styles.diasContainer}>
                      {Object.keys(datosAgrupados[mes]).map((dia) => {
                        const diaKey = `${mes}-${dia}`;
                        const diaAbierto = !!diasAbiertos[diaKey];
                        const tomas = datosAgrupados[mes][dia];

                        return (
                          <View key={dia} style={styles.diaContainer}>
                            {/* Botón Día */}
                            <TouchableOpacity style={styles.diaHeader} onPress={() => toggleDia(diaKey)}>
                              <Text style={styles.diaTitle}>Día {dia} ({tomas.length} tomas)</Text>
                              <Text style={styles.arrow}>{diaAbierto ? "▲" : "▼"}</Text>
                            </TouchableOpacity>

                            {/* Tomas de ese día */}
                            {diaAbierto && (
                              <View style={styles.tomasContainer}>
                                {tomas.map((toma: any) => (
                                  <View key={toma.id} style={styles.tomaCard}>
                                    <View>
                                      <Text style={styles.horaText}>⏰ {toma.hora || "N/D"}</Text>
                                    </View>
                                    <View style={styles.valoresContainer}>
                                      <Text style={styles.valorPrincipal}>
                                        <Text style={{fontWeight: 'bold', color: '#d32f2f'}}>{toma.sistolica}</Text> / <Text style={{fontWeight: 'bold', color: '#1976d2'}}>{toma.diastolica}</Text>
                                      </Text>
                                      <Text style={styles.pulsoText}>Pulso: {toma.pulsaciones}</Text>
                                    </View>
                                    {/* Botón de Borrar */}
                                    <TouchableOpacity 
                                      style={styles.deleteButton} 
                                      onPress={() => confirmarBorrado(toma.id)}
                                    >
                                      <Text style={styles.deleteButtonText}>🗑️</Text>
                                    </TouchableOpacity>
                                  </View>
                                ))}
                              </View>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Modal para Registrar Nueva Toma */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nueva Medición</Text>

            <Text style={styles.label}>Máxima (Sistólica)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. 120"
              keyboardType="numeric"
              value={sistolica}
              onChangeText={setSistolica}
            />

            <Text style={styles.label}>Mínima (Diastólica)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. 80"
              keyboardType="numeric"
              value={diastolica}
              onChangeText={setDiastolica}
            />

            <Text style={styles.label}>Pulsaciones (Opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. 70"
              keyboardType="numeric"
              value={pulsaciones}
              onChangeText={setPulsaciones}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]} 
                onPress={guardarMedicion}
                disabled={guardando}
              >
                {guardando ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Guardar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  addButton: {
    backgroundColor: '#d32f2f',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  exportButton: {
    backgroundColor: '#1976d2',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    justifyContent: 'center',
  },
  exportButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  scrollContainer: {
    padding: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 40,
    fontSize: 16,
    paddingHorizontal: 20,
  },
  mesContainer: {
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  mesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#e3f2fd',
  },
  mesTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#0d47a1',
  },
  arrow: {
    fontSize: 16,
    color: '#666',
  },
  diasContainer: {
    paddingLeft: 12,
    paddingRight: 12,
    paddingBottom: 8,
  },
  diaContainer: {
    marginTop: 8,
    backgroundColor: '#fafafa',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#eee',
    overflow: 'hidden',
  },
  diaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f1f8e9',
  },
  diaTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#33691e',
  },
  tomasContainer: {
    padding: 10,
    gap: 8,
  },
  tomaCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  horaText: {
    fontSize: 24,
    color: '#000000',
  },
  valoresContainer: {
    alignItems: 'flex-end',
  },
  valorPrincipal: {
    fontSize: 24,
  },
  pulsoText: {
    fontSize: 20,
    color: '#000000',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  label: {
    fontSize: 28,
    fontWeight: '600',
    color: '#444',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 28,
    marginBottom: 16,
    backgroundColor: '#fafafa',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#e0e0e0',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 22,
  },
  saveButton: {
    backgroundColor: '#d32f2f',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 22,
  },
  deleteButton: {
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 18,
  },
});