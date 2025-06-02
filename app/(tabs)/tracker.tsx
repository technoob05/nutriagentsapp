import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, Alert } from 'react-native';
import { Card, Title, Button, FAB, List, Chip, TextInput, Modal, Portal } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useApp } from '@/contexts/AppContext';
import { FoodItem, MealEntry } from '@/types';
import { formatDate } from '@/utils/nutritionCalculator';

export default function MealTrackerScreen() {
  const { t } = useTranslation();
  const { state, actions } = useApp();
  const [addMealVisible, setAddMealVisible] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [foodName, setFoodName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [calories, setCalories] = useState('');

  const today = formatDate(new Date());
  const todayNutrition = state.dailyNutrition;
  
  const meals = todayNutrition?.meals || [];
  const breakfastMeals = meals.filter(meal => meal.mealType === 'breakfast');
  const lunchMeals = meals.filter(meal => meal.mealType === 'lunch');
  const dinnerMeals = meals.filter(meal => meal.mealType === 'dinner');
  const snackMeals = meals.filter(meal => meal.mealType === 'snack');

  const totalCalories = todayNutrition?.totalCalories || 0;

  const handleAddFood = () => {
    if (!foodName || !quantity || !calories) {
      Alert.alert(t('common.error'), 'Please fill in all fields');
      return;
    }

    const newFood: FoodItem = {
      id: Date.now().toString(),
      name: foodName,
      calories: parseFloat(calories),
      protein: 0, // We'll enhance this later with AI
      carbs: 0,
      fat: 0,
      quantity: parseFloat(quantity),
      unit: 'g'
    };

    const newMeal: MealEntry = {
      id: Date.now().toString(),
      date: today,
      mealType: selectedMealType,
      foods: [newFood],
      totalCalories: newFood.calories,
      totalProtein: newFood.protein,
      totalCarbs: newFood.carbs,
      totalFat: newFood.fat,
      createdAt: new Date().toISOString()
    };

    // Update daily nutrition
    const updatedMeals = [...meals, newMeal];
    const updatedNutrition = {
      date: today,
      totalCalories: totalCalories + newFood.calories,
      totalProtein: (todayNutrition?.totalProtein || 0) + newFood.protein,
      totalCarbs: (todayNutrition?.totalCarbs || 0) + newFood.carbs,
      totalFat: (todayNutrition?.totalFat || 0) + newFood.fat,
      waterIntake: todayNutrition?.waterIntake || 0,
      meals: updatedMeals
    };

    actions.saveDailyNutrition(updatedNutrition);
    
    // Reset form
    setFoodName('');
    setQuantity('');
    setCalories('');
    setAddMealVisible(false);
  };

  const renderMealSection = (
    title: string, 
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack', 
    meals: MealEntry[]
  ) => {
    const sectionCalories = meals.reduce((sum, meal) => sum + meal.totalCalories, 0);

    return (
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.mealHeader}>
            <Title>{title}</Title>
            <Chip mode="outlined">{sectionCalories} {t('common.kcal')}</Chip>
          </View>
          
          {meals.length === 0 ? (
            <ThemedText style={styles.noMealsText}>
              {t('mealTracker.noMealsToday')}
            </ThemedText>
          ) : (
            meals.map((meal) => (
              <View key={meal.id} style={styles.mealItem}>
                {meal.foods.map((food) => (
                  <List.Item
                    key={food.id}
                    title={food.name}
                    description={`${food.quantity}${food.unit} - ${food.calories} ${t('common.kcal')}`}
                    left={(props) => <List.Icon {...props} icon="food" />}
                  />
                ))}
              </View>
            ))
          )}
          
          <Button 
            mode="outlined" 
            icon="plus"
            style={styles.addButton}
            onPress={() => {
              setSelectedMealType(mealType);
              setAddMealVisible(true);
            }}
          >
            {t('mealTracker.addMeal')}
          </Button>
        </Card.Content>
      </Card>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <ThemedText type="title">{t('mealTracker.title')}</ThemedText>
          <Chip mode="outlined" icon="fire">
            {t('mealTracker.totalCalories')}: {totalCalories} {t('common.kcal')}
          </Chip>
        </View>

        {renderMealSection(t('mealTracker.breakfast'), 'breakfast', breakfastMeals)}
        {renderMealSection(t('mealTracker.lunch'), 'lunch', lunchMeals)}
        {renderMealSection(t('mealTracker.dinner'), 'dinner', dinnerMeals)}
        {renderMealSection(t('mealTracker.snack'), 'snack', snackMeals)}
      </ScrollView>

      <Portal>
        <Modal 
          visible={addMealVisible} 
          onDismiss={() => setAddMealVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Title>{t('mealTracker.addMeal')}</Title>
          
          <TextInput
            label={t('mealTracker.foodName')}
            value={foodName}
            onChangeText={setFoodName}
            style={styles.input}
            mode="outlined"
          />
          
          <TextInput
            label={t('mealTracker.quantity')}
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
            style={styles.input}
            mode="outlined"
          />
          
          <TextInput
            label={t('mealTracker.calories')}
            value={calories}
            onChangeText={setCalories}
            keyboardType="numeric"
            style={styles.input}
            mode="outlined"
          />

          <View style={styles.modalButtons}>
            <Button 
              mode="outlined" 
              onPress={() => setAddMealVisible(false)}
              style={styles.modalButton}
            >
              {t('mealTracker.cancel')}
            </Button>
            <Button 
              mode="contained" 
              onPress={handleAddFood}
              style={styles.modalButton}
            >
              {t('mealTracker.save')}
            </Button>
          </View>
        </Modal>
      </Portal>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setAddMealVisible(true)}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
    gap: 10,
  },
  card: {
    margin: 10,
    elevation: 2,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  mealItem: {
    marginVertical: 5,
  },
  noMealsText: {
    textAlign: 'center',
    opacity: 0.6,
    marginVertical: 20,
  },
  addButton: {
    marginTop: 10,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  input: {
    marginVertical: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 10,
  },
  modalButton: {
    flex: 1,
  },
});
