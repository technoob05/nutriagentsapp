import { Picker } from '@react-native-picker/picker';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, List, SegmentedButtons, TextInput, Title } from 'react-native-paper';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useApp } from '@/contexts/AppContext';
import { UserProfile } from '@/types';
import {
  activityLevels,
  calculateBMI,
  calculateBMR,
  calculateTDEE,
  calculateTargetCalories,
  getBMICategory
} from '@/utils/nutritionCalculator';

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const { state, actions } = useApp();
  const [isEditing, setIsEditing] = useState(!state.userProfile);
  
  const [formData, setFormData] = useState({
    age: state.userProfile?.age?.toString() || '',
    gender: state.userProfile?.gender || 'male',
    weight: state.userProfile?.weight?.toString() || '',
    height: state.userProfile?.height?.toString() || '',
    activityLevel: state.userProfile?.activityLevel || 'moderate',
    goal: state.userProfile?.goal || 'maintainWeight',
  });

  const currentLanguage = i18n.language as 'en' | 'vi';

  const handleSave = async () => {
    // Validation
    if (!formData.age || !formData.weight || !formData.height) {
      Alert.alert(t('common.error'), 'Please fill in all required fields');
      return;
    }

    const age = parseInt(formData.age);
    const weight = parseFloat(formData.weight);
    const height = parseFloat(formData.height);

    if (age < 10 || age > 100 || weight < 30 || weight > 300 || height < 100 || height > 250) {
      Alert.alert(t('common.error'), 'Please enter valid values');
      return;
    }

    const profile: UserProfile = {
      id: state.userProfile?.id || Date.now().toString(),
      age,
      gender: formData.gender as 'male' | 'female',
      weight,
      height,
      activityLevel: formData.activityLevel as any,
      goal: formData.goal as any,
      language: currentLanguage,
      createdAt: state.userProfile?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Calculate BMR, TDEE, and target calories
    profile.bmr = calculateBMR(profile);
    profile.tdee = calculateTDEE(profile);
    profile.targetCalories = calculateTargetCalories(profile);

    await actions.saveUserProfile(profile);
    actions.setOnboarded(true);
    setIsEditing(false);
    
    Alert.alert(t('common.success'), 'Profile saved successfully!');
  };

  const handleLanguageChange = async (language: 'en' | 'vi') => {
    await i18n.changeLanguage(language);
    if (state.userProfile) {
      const updatedProfile = { ...state.userProfile, language };
      await actions.saveUserProfile(updatedProfile);
    }
  };

  const userProfile = state.userProfile;
  const bmi = userProfile ? calculateBMI(userProfile.weight, userProfile.height) : 0;
  const bmiCategory = userProfile ? getBMICategory(bmi, currentLanguage) : '';

  return (
    <ThemedView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <ThemedText type="title">{t('profile.title')}</ThemedText>
          {userProfile && !isEditing && (
            <Button mode="outlined" onPress={() => setIsEditing(true)}>
              Edit
            </Button>
          )}
        </View>

        {/* Language Settings */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>{t('profile.language')}</Title>
            <SegmentedButtons
              value={currentLanguage}
              onValueChange={handleLanguageChange}
              buttons={[
                { value: 'en', label: 'English' },
                { value: 'vi', label: 'Tiếng Việt' }
              ]}
              style={styles.segmentedButtons}
            />
          </Card.Content>
        </Card>

        {/* Personal Information */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>{t('profile.personalInfo')}</Title>
            
            <TextInput
              label={t('profile.age')}
              value={formData.age}
              onChangeText={(text) => setFormData({...formData, age: text})}
              keyboardType="numeric"
              mode="outlined"
              style={styles.input}

            />

            <View style={styles.pickerContainer}>
              <ThemedText style={styles.pickerLabel}>{t('profile.gender')}</ThemedText>
              <Picker
                selectedValue={formData.gender}
                onValueChange={(value) => setFormData({...formData, gender: value})}
                enabled={isEditing}
                style={styles.picker}
              >
                <Picker.Item label={t('profile.male')} value="male" />
                <Picker.Item label={t('profile.female')} value="female" />
              </Picker>
            </View>

            <TextInput
              label={`${t('profile.weight')} (${t('common.kg')})`}
              value={formData.weight}
              onChangeText={(text) => setFormData({...formData, weight: text})}
              keyboardType="numeric"
              mode="outlined"
              style={styles.input}

            />

            <TextInput
              label={`${t('profile.height')} (${t('common.cm')})`}
              value={formData.height}
              onChangeText={(text) => setFormData({...formData, height: text})}
              keyboardType="numeric"
              mode="outlined"
              style={styles.input}

            />
          </Card.Content>
        </Card>

        {/* Activity Level */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>{t('profile.activityLevel')}</Title>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.activityLevel}
                onValueChange={(value) => setFormData({...formData, activityLevel: value})}
                enabled={isEditing}
                style={styles.picker}
              >
                {activityLevels.map((level) => (
                  <Picker.Item 
                    key={level.key}
                    label={t(`profile.${level.key}`)} 
                    value={level.key} 
                  />
                ))}
              </Picker>
            </View>
          </Card.Content>
        </Card>

        {/* Goals */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>{t('profile.goals')}</Title>
            <SegmentedButtons
              value={formData.goal}
              onValueChange={(value) => setFormData({...formData, goal: value})}
              buttons={[
                { value: 'loseWeight', label: t('profile.loseWeight') },
                { value: 'maintainWeight', label: t('profile.maintainWeight') },
                { value: 'gainWeight', label: t('profile.gainWeight') }
              ]}
              style={styles.segmentedButtons}

            />
          </Card.Content>
        </Card>

        {/* Calculated Values */}
        {userProfile && (
          <Card style={styles.card}>
            <Card.Content>
              <Title>Health Metrics</Title>
              
              <List.Item
                title={`BMI: ${bmi}`}
                description={bmiCategory}
                left={(props) => <List.Icon {...props} icon="scale" />}
              />
              
              <List.Item
                title={`${t('profile.bmr')}: ${userProfile.bmr} ${t('common.kcal')}`}
                description="Basal Metabolic Rate"
                left={(props) => <List.Icon {...props} icon="fire" />}
              />
              
              <List.Item
                title={`${t('profile.tdee')}: ${userProfile.tdee} ${t('common.kcal')}`}
                description="Total Daily Energy Expenditure"
                left={(props) => <List.Icon {...props} icon="lightning-bolt" />}
              />
              
              <List.Item
                title={`${t('profile.targetCalories')}: ${userProfile.targetCalories} ${t('common.kcal')}`}
                description="Daily calorie goal"
                left={(props) => <List.Icon {...props} icon="target" />}
              />
            </Card.Content>
          </Card>
        )}

        {/* Save Button */}
        {isEditing && (
          <View style={styles.buttonContainer}>
            <Button 
              mode="contained" 
              onPress={handleSave}
              style={styles.saveButton}
            >
              {t('profile.save')}
            </Button>
            {userProfile && (
              <Button 
                mode="outlined" 
                onPress={() => {
                  setIsEditing(false);
                  // Reset form data
                  setFormData({
                    age: userProfile.age.toString(),
                    gender: userProfile.gender,
                    weight: userProfile.weight.toString(),
                    height: userProfile.height.toString(),
                    activityLevel: userProfile.activityLevel,
                    goal: userProfile.goal,
                  });
                }}
                style={styles.cancelButton}
              >
                Cancel
              </Button>
            )}
          </View>
        )}
      </ScrollView>
    </ThemedView>
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
    padding: 20,
    paddingTop: 60,
  },
  card: {
    margin: 10,
    elevation: 2,
  },
  input: {
    marginVertical: 8,
  },
  pickerContainer: {
    marginVertical: 8,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  picker: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  segmentedButtons: {
    marginVertical: 10,
  },
  buttonContainer: {
    padding: 20,
    gap: 10,
  },
  saveButton: {
    paddingVertical: 8,
  },
  cancelButton: {
    paddingVertical: 8,
  },
});
