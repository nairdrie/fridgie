// components/GroceryListView.tsx
import { AggregatedItem, Item } from '@/types/types';
import * as Haptics from 'expo-haptics';
import { LexoRank } from 'lexorank';
import React, { useCallback, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import uuid from 'react-native-uuid';
import QuantityEditorModal, { parseQuantityAndText } from './QuantityEditorModal';

interface GroceryListViewProps {
  items: AggregatedItem[];
  editingId: string;
  setEditingId: React.Dispatch<React.SetStateAction<string>>;
  inputRefs: React.MutableRefObject<Record<string, TextInput | null>>;
  isKeyboardVisible: boolean;
  markDirty: () => void;
  onUpdateQuantity: (itemName: string, quantity: number, unit: string) => void;
  onDeleteItem: (itemsToDelete: Item[]) => void;
  onUpdateItemText: (aggItem: AggregatedItem, newText: string) => void;
  onToggleCheck: (itemIds: string[], newCheckedState: boolean) => void;
  onReRankItems: (newOrderedItems: Item[]) => void;
}

export default function GroceryListView({
  items,
  editingId,
  setEditingId,
  inputRefs,
  isKeyboardVisible,
  markDirty,
  onUpdateQuantity,
  onDeleteItem,
  onUpdateItemText,
  onToggleCheck,
  onReRankItems,
}: GroceryListViewProps) {

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<AggregatedItem | null>(null);
  const [editingText, setEditingText] = useState<string>('');

  const assignRef = useCallback((id: string) => (ref: TextInput | null) => {
    inputRefs.current[id] = ref;
  }, [inputRefs]);

  const toggleCheck = (id: string) => {
    const itemToToggle = items.find(item => item.id === id);
    if (!itemToToggle) return;

    const newCheckedState = !itemToToggle.checked;
    const underlyingItemIds = itemToToggle.items.map(i => i.id);
    onToggleCheck(underlyingItemIds, newCheckedState);
  };

  const openQuantityEditor = (item: AggregatedItem) => {
    setSelectedItem(item);
    setIsModalVisible(true);
  };

  const closeQuantityEditor = () => {
    setIsModalVisible(false);
    setSelectedItem(null);
  };

  const handleSaveQuantity = (newQuantity: number, newUnit: string) => {
    if (!selectedItem) return;
    onUpdateQuantity(selectedItem.name, newQuantity, newUnit);
    closeQuantityEditor();
  };

  const deleteItem = (id: string) => {
    const itemToDelete = items.find(item => item.id === id);
    if (!itemToDelete) return;
    onDeleteItem(itemToDelete.items);
  };

  const updateItemText = (id: string, newText: string) => {
    const itemToUpdate = items.find(item => item.id === id);
    if (!itemToUpdate) return;
    onUpdateItemText(itemToUpdate, newText);
  };

  const reRankItems = (data: AggregatedItem[]) => {
    const flattenedItems = data.flatMap(aggItem => aggItem.items);

    let rank = LexoRank.middle();
    const newOrderedItems = flattenedItems.map(item => {
      const newItem = { ...item, listOrder: rank.toString() };
      rank = rank.genNext();
      return newItem;
    });
    
    onReRankItems(newOrderedItems);
  };

  const addItemAfter = (id: string) => {
    const aggIndex = items.findIndex(i => i.id === id);
    if (aggIndex === -1) return;

    const currentAggItem = items[aggIndex];
    const lastUnderlyingItem = currentAggItem.items[currentAggItem.items.length - 1];
    const currentRank = LexoRank.parse(lastUnderlyingItem.listOrder);

    let nextRank;
    const nextAggItem = items[aggIndex + 1];
    if (nextAggItem && nextAggItem.items.length > 0) {
      nextRank = LexoRank.parse(nextAggItem.items[0].listOrder);
    } else {
      nextRank = currentRank.genNext();
    }

    const newRank = currentRank.between(nextRank);
    const newItem: Item = {
      id: uuid.v4() as string,
      text: '',
      checked: false,
      listOrder: newRank.toString(),
      isSection: false,
      isManuallyAdded: true,
    };

    setItems(prevItems => {
      const insertionIndex = prevItems.findIndex(i => i.id === lastUnderlyingItem.id);
      if (insertionIndex === -1) return prevItems; // Should not happen
      const updatedItems = [...prevItems];
      updatedItems.splice(insertionIndex + 1, 0, newItem);
      return updatedItems;
    });

    setEditingId(newItem.id);
    markDirty();
    setTimeout(() => inputRefs.current[newItem.id]?.focus(), 50);
  };

  const renderItem = useCallback(({ item, drag, isActive }: RenderItemParams<AggregatedItem>) => {
    const isEditing = item.id === editingId;
    return (
      <View style={styles.itemRow}>
        <Pressable
          onLongPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            drag();
          }}
          disabled={isActive}
          style={styles.dragHandle}
          hitSlop={20}
        >
          <Text style={styles.dragIcon}>≡</Text>
        </Pressable>
        <TouchableOpacity style={styles.checkbox} onPress={() => toggleCheck(item.id)}>
          {item.checked ? <Text>✓</Text> : null}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => openQuantityEditor(item)}>
          <View style={[styles.quantityLabel, item.checked && styles.quantityChecked]}>
            <Text style={[item.checked && styles.quantityTextChecked]}>{`${item.quantity} ${item.unit}`}</Text>
          </View>
        </TouchableOpacity>
        <TextInput
            ref={assignRef(item.id)}
            value={isEditing ? editingText : item.name}
            style={[styles.editInput, item.checked && styles.checked]}
            onChangeText={text => {
                setEditingText(text);
                updateItemText(item.id, text);
            }}
            onFocus={() => {
                setEditingId(item.id);
                setEditingText(item.name);
            }}
            onKeyPress={({ nativeEvent }) => {
              if (nativeEvent.key === 'Backspace' && editingText === '') {
                deleteItem(item.id);
              }
            }}
            onSubmitEditing={() => addItemAfter(item.id)}
            onBlur={() => {
                setEditingId('');
            }}
            blurOnSubmit={false}
            returnKeyType="done"
        />
        {isEditing ? (
          <TouchableOpacity
            onPress={() => deleteItem(item.id)}
            style={styles.clearButton}
          >
            <Text style={styles.clearText}>✕</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.clearButton}>
            <Text style={styles.clearText}></Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }, [editingId, items, assignRef]);


  return (
    <>
      <DraggableFlatList
        data={items}
        onDragEnd={({ data }) => reRankItems(data)}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        dragItemOverflow={true}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={10}
        ListEmptyComponent={(
          <View style={styles.emptyListComponent}>
            <Text style={styles.emptyListText}>Your list is empty.</Text>
            <Text style={styles.emptyListSubText}>Tap the '+' to add an item.</Text>
          </View>
        )}
      />
      <QuantityEditorModal
          isVisible={isModalVisible}
          item={selectedItem}
          onSave={handleSaveQuantity}
          onClose={closeQuantityEditor}
      />
    </>
  );
}

const styles = StyleSheet.create({
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5 },
  dragHandle: { paddingHorizontal: 15, paddingVertical: 5 },
  dragIcon: { fontSize: 18, color: '#ccc' },
  checkbox: { width: 24, height: 24, marginRight: 10, borderWidth: 1, borderColor: '#999', alignItems: 'center', justifyContent: 'center', borderRadius: 4 },
  editInput: { fontSize: 16, flex: 1, paddingVertical: 0 },
  checked: { textDecorationLine: 'line-through', color: '#999' },
  clearButton: { paddingHorizontal: 8, paddingVertical: 4 },
  clearText: { fontSize: 16, color: '#999' },
  sectionText: { fontWeight: 'bold', fontSize: 18 },
  emptyListComponent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyListText: {
    fontSize: 18,
    color: '#888',
    fontWeight: '600'
  },
  emptyListSubText: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 8,
  },
  quantityLabel: {
    backgroundColor: '#ebebebff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginHorizontal: 3
  },
  quantityChecked: { backgroundColor: '#eeeeee' },
  quantityTextChecked: { textDecorationLine: 'line-through', color: '#999' },
});