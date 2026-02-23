
import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { FURNITURE_CATALOG } from '../constants/furnitureCatalog';

const FurniturePanel = ({ selectedId, onAddFurniture }) => {
  return (
    <View style={styles.panel}>
      <Text style={styles.title}>Furniture</Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        {FURNITURE_CATALOG.map(item => (
          <Pressable
            key={item.id}
            style={[styles.item, { backgroundColor: item.color, borderWidth: selectedId === item.id ? 2 : 0 }]}
            onPress={() => onAddFurniture && onAddFurniture(item)}
          >
            <Text style={styles.label}>
              {item.label}
            </Text>
            <Text style={styles.dimensions}>{`${item.w}m x ${item.h}m`}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>

  );
};

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 140,
    backgroundColor: '#f7f7f7',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRightWidth: 1,
    borderColor: '#ccc',
    zIndex: 100,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  item: {
    marginBottom: 14,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 10,
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'center',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#eee',
  },
  label: {
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 2,
    color: '#222',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    marginLeft: 2,
    color: '#333',
    letterSpacing: 0.5,
  },
  dimensions: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
    marginLeft: 2,
  },
});

export default FurniturePanel;
