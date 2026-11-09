import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Importación de Firebase
import { db } from '../../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

export default function TablaScreen() {
  const [loading, setLoading] = useState(true);
  const [registros, setRegistros] = useState<any[]>([]);

  useEffect(() => {
    cargarRegistros();
  }, []);

  const cargarRegistros = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, "registros_presion"), orderBy("timestamp", "desc"));
      const querySnapshot = await getDocs(q);
      const lista: any[] = [];
      querySnapshot.forEach((doc) => {
        lista.push({ id: doc.id, ...doc.data() });
      });
      setRegistros(lista);
    } catch (error) {
      console.error("Error al cargar registros para la tabla:", error);
    } finally {
      setLoading(false);
    }
  };

  // Función para formatear la fecha numérica (YYYY-MM-DD) a texto legible en Español
  const formatearFechaEnEspanol = (fechaStr: string) => {
    if (!fechaStr) return 'N/D';
    try {
      const [ano, mes, dia] = fechaStr.split('-').map(Number);
      const fechaObj = new Date(ano, mes - 1, dia);
      
      const opciones: Intl.DateTimeFormatOptions = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      };
      
      let fechaFormateada = fechaObj.toLocaleDateString('es-ES', opciones);
      return fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1);
    } catch (e) {
      return fechaStr;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Cabecera limpia sin botón de volver */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Historial en Tabla</Text>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#d32f2f" />
          <Text style={styles.loadingText}>Cargando tabla...</Text>
        </View>
      ) : (
        <View style={styles.tableContainer}>
          {/* Cabecera de la Tabla */}
          <View style={[styles.row, styles.tableHeader]}>
            <Text style={[styles.cell, styles.headerCell, { flex: 1.6 }]}>Fecha</Text>
            <Text style={[styles.cell, styles.headerCell, { flex: 0.8 }]}>Hora</Text>
            <Text style={[styles.cell, styles.headerCell, { flex: 1 }]}>Máx / Mín</Text>
            <Text style={[styles.cell, styles.headerCell, { flex: 0.7 }]}>Pulso</Text>
          </View>

          {/* Filas de la Tabla con Scroll */}
          <ScrollView contentContainerStyle={styles.scrollBody}>
            {registros.length === 0 ? (
              <Text style={styles.emptyText}>No hay registros disponibles todavía.</Text>
            ) : (
              registros.map((item, index) => (
                <View key={item.id || index} style={[styles.row, index % 2 === 0 ? styles.evenRow : styles.oddRow]}>
                  {/* Columna Fecha en Letras */}
                  <View style={[styles.cell, { flex: 1.6, alignItems: 'flex-start', paddingLeft: 8 }]}>
                    <Text style={styles.dateText}>{formatearFechaEnEspanol(item.fecha)}</Text>
                  </View>

                  {/* Columna Hora */}
                  <View style={[styles.cell, { flex: 0.8 }]}>
                    <Text style={styles.timeText}>{item.hora || 'N/D'}</Text>
                  </View>

                  {/* Columna Máx / Mín */}
                  <View style={[styles.cell, { flex: 1 }]}>
                    <Text style={styles.bpText}>
                      <Text style={{ color: '#d32f2f', fontWeight: 'bold' }}>{item.sistolica}</Text>
                      <Text style={{ color: '#555' }}> / </Text>
                      <Text style={{ color: '#1976d2', fontWeight: 'bold' }}>{item.diastolica}</Text>
                    </Text>
                  </View>

                  {/* Columna Pulso */}
                  <View style={[styles.cell, { flex: 0.7 }]}>
                    <Text style={styles.pulseText}>{item.pulsaciones || '-'}</Text>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  tableContainer: {
    flex: 1,
    margin: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#d0d0d0',
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
  },
  tableHeader: {
    backgroundColor: '#00796b',
  },
  headerCell: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  cell: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollBody: {
    paddingBottom: 30,
  },
  evenRow: {
    backgroundColor: '#fff',
  },
  oddRow: {
    backgroundColor: '#fafafa',
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
  },
  timeText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#444',
  },
  bpText: {
    fontSize: 18,
  },
  pulseText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 50,
    fontSize: 18,
  },
});