
import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { FURNITURE_CATALOG } from '../constants/furnitureCatalog';

const FurniturePanel = ({ selectedId, onAddFurniture }) => {
  return (
    <View style={styles.panel}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {FURNITURE_CATALOG.map(item => (
          <Pressable
            key={item.id}
            style={[styles.item, { backgroundColor: item.color, borderWidth: selectedId === item.id ? 2 : 0 }]}
            onPress={() => onAddFurniture && onAddFurniture(item)}
          >
            <Text style={styles.label}>
              {item.label}
              {` (${item.w}x${item.h})`}
            </Text>
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
    width: 100,
    backgroundColor: '#fff',
    paddingVertical: 8,
    borderRightWidth: 1,
    borderColor: '#ccc',
    zIndex: 100,
  },
  item: {
    marginVertical: 8,
    marginHorizontal: 4,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 60,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default FurniturePanel;
