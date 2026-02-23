import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, TouchableOpacity, Switch } from 'react-native';
import { FURNITURE_CATALOG } from '../constants/furnitureCatalog';

interface FurniturePanelProps {
  selectedId?: string | null; 
  onAddFurniture: (item: any) => void;
}

const FurniturePanel: React.FC<FurniturePanelProps> = ({ selectedId, onAddFurniture }) => {
  // Toggle between 'list' and 'filter' view
  const [viewMode, setViewMode] = useState<'list' | 'filter'>('list');
  
  const categories = [...new Set(FURNITURE_CATALOG.map(item => item.category))];
  const [selectedCategories, setSelectedCategories] = useState(categories);

  const filteredCatalog = FURNITURE_CATALOG.filter(item => 
    selectedCategories.includes(item.category)
  );

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  return (
    <View style={styles.panel}>
      <View style={styles.header}>
        <Text style={styles.title}>{viewMode === 'list' ? 'Furniture' : 'Filters'}</Text>
        <TouchableOpacity 
          onPress={() => setViewMode(viewMode === 'list' ? 'filter' : 'list')} 
          style={styles.filterButton}
        >
          <Text style={{ fontSize: 18 }}>{viewMode === 'list' ? '⚙️' : '✅'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {viewMode === 'list' ? (
          // LIST VIEW
          filteredCatalog.map(item => (
            <Pressable
              key={item.id}
              style={[
                styles.item, 
                { backgroundColor: item.color, borderWidth: selectedId === item.id ? 2 : 1 }
              ]}
              onPress={() => onAddFurniture(item)}
            >
              <Text style={styles.label}>{item.label}</Text>
              <Text style={styles.dimensions}>{`${item.w}m x ${item.h}m`}</Text>
            </Pressable>
          ))
        ) : (
          // FILTER VIEW (Inline, no Modal)
          categories.map(category => (
            <View key={category} style={styles.filterRow}>
              <Text style={styles.categoryLabel}>{category}</Text>
              <Switch
                value={selectedCategories.includes(category)}
                onValueChange={() => toggleCategory(category)}
                trackColor={{ false: "#d1d1d1", true: "#81b0ff" }}
              />
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  panel: {
    position: 'absolute', left: 0, top: 0, bottom: 0, width: 140,
    backgroundColor: '#f7f7f7', paddingVertical: 16, paddingHorizontal: 12,
    borderRightWidth: 1, borderColor: '#ccc', zIndex: 100,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  filterButton: { padding: 4 },
  item: { marginBottom: 12, borderRadius: 8, padding: 10, backgroundColor: '#fff', borderColor: '#eee' },
  label: { fontWeight: 'bold', fontSize: 14, color: '#222' },
  dimensions: { fontSize: 11, color: '#666' },
  filterRow: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' 
  },
  categoryLabel: { fontSize: 12, color: '#444', textTransform: 'capitalize' },
});

export default FurniturePanel;