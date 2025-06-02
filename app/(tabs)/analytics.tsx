import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, ScrollView, StyleSheet, View } from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';
import { Card, Chip, SegmentedButtons, Title } from 'react-native-paper';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useApp } from '@/contexts/AppContext';
import { getWeekDates } from '@/utils/nutritionCalculator';

const { width } = Dimensions.get('window');
const chartConfig = {
  backgroundColor: '#ffffff',
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(76, 102, 159, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: '6',
    strokeWidth: '2',
    stroke: '#4c669f',
  },
};

export default function AnalyticsScreen() {
  const { t } = useTranslation();
  const { state } = useApp();
  const [timeRange, setTimeRange] = useState('week');
  const [weeklyData, setWeeklyData] = useState({
    calories: [] as number[],
    dates: [] as string[],
  });

  const userProfile = state.userProfile;
  const todayNutrition = state.dailyNutrition;

  useEffect(() => {
    // Generate mock data for the week
    const dates = getWeekDates();
    const calories = dates.map(() => Math.floor(Math.random() * 800) + 1500); // Mock data
    
    setWeeklyData({
      calories,
      dates: dates.map(date => new Date(date).getDate().toString()),
    });
  }, []);

  const totalCaloriesToday = todayNutrition?.totalCalories || 0;
  const targetCalories = userProfile?.targetCalories || 2000;
  const averageCalories = weeklyData.calories.length > 0 
    ? Math.round(weeklyData.calories.reduce((sum, cal) => sum + cal, 0) / weeklyData.calories.length)
    : 0;

  // Mock streak data
  const loggingStreak = 7;

  // Macro distribution data
  const macroData = [
    {
      name: t('dashboard.protein'),
      population: todayNutrition?.totalProtein || 0,
      color: '#FF5722',
      legendFontColor: '#7F7F7F',
      legendFontSize: 15,
    },
    {
      name: t('dashboard.carbs'),
      population: todayNutrition?.totalCarbs || 0,
      color: '#2196F3',
      legendFontColor: '#7F7F7F',
      legendFontSize: 15,
    },
    {
      name: t('dashboard.fat'),
      population: todayNutrition?.totalFat || 0,
      color: '#FF9800',
      legendFontColor: '#7F7F7F',
      legendFontSize: 15,
    },
  ].filter(item => item.population > 0);

  const caloriesChartData = {
    labels: weeklyData.dates,
    datasets: [
      {
        data: weeklyData.calories,
        color: (opacity = 1) => `rgba(76, 102, 159, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  const barChartData = {
    labels: weeklyData.dates.slice(0, 5), // Last 5 days
    datasets: [
      {
        data: weeklyData.calories.slice(0, 5),
      },
    ],
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <ThemedText type="title">{t('analytics.title')}</ThemedText>
        </View>

        {/* Time Range Selector */}
        <Card style={styles.card}>
          <Card.Content>
            <SegmentedButtons
              value={timeRange}
              onValueChange={setTimeRange}
              buttons={[
                { value: 'week', label: 'Week' },
                { value: 'month', label: 'Month' },
                { value: 'year', label: 'Year' }
              ]}
              style={styles.segmentedButtons}
            />
          </Card.Content>
        </Card>

        {/* Summary Stats */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Overview</Title>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <ThemedText type="subtitle">{averageCalories}</ThemedText>
                <ThemedText style={styles.statLabel}>
                  {t('analytics.averageCalories')}
                </ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText type="subtitle">{loggingStreak}</ThemedText>
                <ThemedText style={styles.statLabel}>
                  {t('analytics.streak')} {t('analytics.days')}
                </ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText type="subtitle">{totalCaloriesToday}</ThemedText>
                <ThemedText style={styles.statLabel}>Today's Calories</ThemedText>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Calories Trend Chart */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>{t('analytics.caloriesTrend')}</Title>
            {weeklyData.calories.length > 0 && (
              <LineChart
                data={caloriesChartData}
                width={width - 60}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
              />
            )}
          </Card.Content>
        </Card>

        {/* Weekly Progress Bar Chart */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>{t('analytics.weeklyProgress')}</Title>
            {weeklyData.calories.length > 0 && (
              <BarChart
                data={barChartData}
                width={width - 60}
                height={220}
                chartConfig={chartConfig}
                style={styles.chart}
                verticalLabelRotation={0}
                yAxisLabel=""
                yAxisSuffix=""
              />
            )}
          </Card.Content>
        </Card>

        {/* Macro Distribution */}
        {macroData.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Title>{t('analytics.macroDistribution')}</Title>
              <PieChart
                data={macroData}
                width={width - 60}
                height={220}
                chartConfig={chartConfig}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                style={styles.chart}
              />
            </Card.Content>
          </Card>
        )}

        {/* Goal Progress */}
        {userProfile && (
          <Card style={styles.card}>
            <Card.Content>
              <Title>Goal Progress</Title>
              <View style={styles.goalContainer}>
                <Chip icon="target" mode="outlined">
                  Target: {targetCalories} kcal/day
                </Chip>
                <Chip 
                  icon="trending-up" 
                  mode={totalCaloriesToday <= targetCalories ? "outlined" : "flat"}
                  style={totalCaloriesToday <= targetCalories ? {} : { backgroundColor: '#FFE0B2' }}
                >
                  Today: {totalCaloriesToday} kcal
                </Chip>
              </View>
              
              <ThemedText style={styles.goalText}>
                {totalCaloriesToday <= targetCalories 
                  ? "You're on track with your calorie goal!"
                  : `You're ${totalCaloriesToday - targetCalories} calories over your goal.`
                }
              </ThemedText>
            </Card.Content>
          </Card>
        )}

        {/* Insights */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Insights</Title>
            <ThemedText style={styles.insightText}>
              • Your average daily intake this week is {averageCalories} calories
            </ThemedText>
            <ThemedText style={styles.insightText}>
              • You've been consistent with logging for {loggingStreak} days
            </ThemedText>
            {userProfile && (
              <ThemedText style={styles.insightText}>
                • {totalCaloriesToday <= targetCalories 
                    ? "Great job staying within your calorie target!"
                    : "Consider lighter meals to reach your calorie goal"
                  }
              </ThemedText>
            )}
          </Card.Content>
        </Card>
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
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
  },
  card: {
    margin: 10,
    elevation: 2,
  },
  segmentedButtons: {
    marginVertical: 10,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'center',
    marginTop: 4,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  goalContainer: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 10,
    flexWrap: 'wrap',
  },
  goalText: {
    marginTop: 10,
    fontStyle: 'italic',
  },
  insightText: {
    marginVertical: 4,
    fontSize: 14,
    lineHeight: 20,
  },
});
