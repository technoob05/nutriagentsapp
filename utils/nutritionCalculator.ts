import { ActivityLevel, UserProfile } from '../types';

export const activityLevels: ActivityLevel[] = [
  {
    key: 'sedentary',
    multiplier: 1.2,
    description: 'Little or no exercise'
  },
  {
    key: 'light',
    multiplier: 1.375,
    description: 'Light exercise/sports 1-3 days/week'
  },
  {
    key: 'moderate',
    multiplier: 1.55,
    description: 'Moderate exercise/sports 3-5 days/week'
  },
  {
    key: 'active',
    multiplier: 1.725,
    description: 'Hard exercise/sports 6-7 days a week'
  },
  {
    key: 'veryActive',
    multiplier: 1.9,
    description: 'Very hard exercise/sports & physical job'
  }
];

export const calculateBMR = (userProfile: UserProfile): number => {
  const { age, gender, weight, height } = userProfile;
  
  // Mifflin-St Jeor Equation
  if (gender === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
};

export const calculateTDEE = (userProfile: UserProfile): number => {
  const bmr = calculateBMR(userProfile);
  const activityLevel = activityLevels.find(level => level.key === userProfile.activityLevel);
  return Math.round(bmr * (activityLevel?.multiplier || 1.2));
};

export const calculateTargetCalories = (userProfile: UserProfile): number => {
  const tdee = calculateTDEE(userProfile);
  
  switch (userProfile.goal) {
    case 'loseWeight':
      return Math.round(tdee - 500); // 1 lb per week deficit
    case 'gainWeight':
      return Math.round(tdee + 500); // 1 lb per week surplus
    case 'maintainWeight':
    default:
      return tdee;
  }
};

export const calculateMacroTargets = (targetCalories: number, goal: string) => {
  let proteinPercent = 0.25;
  let fatPercent = 0.25;
  let carbPercent = 0.5;

  // Adjust macros based on goal
  if (goal === 'loseWeight') {
    proteinPercent = 0.3;
    fatPercent = 0.25;
    carbPercent = 0.45;
  } else if (goal === 'gainWeight') {
    proteinPercent = 0.25;
    fatPercent = 0.3;
    carbPercent = 0.45;
  }

  return {
    protein: Math.round((targetCalories * proteinPercent) / 4), // 4 cal per gram
    carbs: Math.round((targetCalories * carbPercent) / 4), // 4 cal per gram
    fat: Math.round((targetCalories * fatPercent) / 9), // 9 cal per gram
  };
};

export const calculateBMI = (weight: number, height: number): number => {
  const heightInMeters = height / 100;
  return Math.round((weight / (heightInMeters * heightInMeters)) * 10) / 10;
};

export const getBMICategory = (bmi: number, language: string = 'en'): string => {
  const isVietnamese = language === 'vi';
  
  if (bmi < 18.5) {
    return isVietnamese ? 'Thiếu cân' : 'Underweight';
  } else if (bmi < 25) {
    return isVietnamese ? 'Bình thường' : 'Normal weight';
  } else if (bmi < 30) {
    return isVietnamese ? 'Thừa cân' : 'Overweight';
  } else {
    return isVietnamese ? 'Béo phì' : 'Obese';
  }
};

export const getWeightRecommendation = (
  currentWeight: number,
  goal: string,
  language: string = 'en'
): string => {
  const isVietnamese = language === 'vi';
  
  switch (goal) {
    case 'loseWeight':
      return isVietnamese 
        ? `Để giảm cân an toàn, hãy tạo ra thâm hụt khoảng 500 calo/ngày để giảm 0.5kg/tuần.`
        : `For safe weight loss, aim for a 500 calorie deficit daily to lose 1 lb per week.`;
    case 'gainWeight':
      return isVietnamese
        ? `Để tăng cân lành mạnh, hãy tạo ra thặng dư khoảng 500 calo/ngày để tăng 0.5kg/tuần.`
        : `For healthy weight gain, aim for a 500 calorie surplus daily to gain 1 lb per week.`;
    case 'maintainWeight':
    default:
      return isVietnamese
        ? `Để duy trì cân nặng, hãy cân bằng lượng calo tiêu thụ và đốt cháy.`
        : `To maintain weight, balance your calorie intake with your calorie expenditure.`;
  }
};

export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const formatDisplayDate = (dateString: string, language: string = 'en'): string => {
  const date = new Date(dateString);
  const isVietnamese = language === 'vi';
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  
  return date.toLocaleDateString(isVietnamese ? 'vi-VN' : 'en-US', options);
};

export const getWeekDates = (startDate: Date = new Date()): string[] => {
  const dates: string[] = [];
  const currentDate = new Date(startDate);
  
  // Get Monday of current week
  const day = currentDate.getDay();
  const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1);
  currentDate.setDate(diff);
  
  // Generate 7 days
  for (let i = 0; i < 7; i++) {
    dates.push(formatDate(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
};
