import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatMessage, Recipe, UserProfile } from '../types';

const GEMINI_API_KEY = 'AIzaSyCwg1omBoK9kSWwmjJ3BWFb0CO7oEAAJVU';

class AIService {
  private model: ChatGoogleGenerativeAI;
  private parser: StringOutputParser;

  constructor() {
    this.model = new ChatGoogleGenerativeAI({
      apiKey: GEMINI_API_KEY,
      model: 'gemini-pro',
      temperature: 0.7,
      maxOutputTokens: 2048,
    });
    this.parser = new StringOutputParser();
  }

  private createSystemPrompt(userProfile: UserProfile | null, language: string): string {
    const isVietnamese = language === 'vi';
    
    const basePrompt = isVietnamese 
      ? `Bạn là một chuyên gia dinh dưỡng AI thân thiện và hiểu biết tên Nutri Agent. Bạn giúp người dùng với các câu hỏi về dinh dưỡng, công thức nấu ăn, kế hoạch bữa ăn và lời khuyên sức khỏe.`
      : `You are a friendly and knowledgeable AI nutrition expert named Nutri Agent. You help users with nutrition questions, recipes, meal planning, and health advice.`;

    let profileInfo = '';
    if (userProfile) {
      const goalText = isVietnamese 
        ? userProfile.goal === 'loseWeight' ? 'giảm cân' 
          : userProfile.goal === 'gainWeight' ? 'tăng cân' 
          : 'duy trì cân nặng'
        : userProfile.goal === 'loseWeight' ? 'lose weight'
          : userProfile.goal === 'gainWeight' ? 'gain weight'
          : 'maintain weight';

      const activityText = isVietnamese
        ? userProfile.activityLevel === 'sedentary' ? 'ít vận động'
          : userProfile.activityLevel === 'light' ? 'vận động nhẹ'
          : userProfile.activityLevel === 'moderate' ? 'vận động vừa phải'
          : userProfile.activityLevel === 'active' ? 'vận động nhiều'
          : 'vận động rất nhiều'
        : userProfile.activityLevel;

      profileInfo = isVietnamese
        ? `\n\nThông tin người dùng:\n- Tuổi: ${userProfile.age}\n- Giới tính: ${userProfile.gender === 'male' ? 'Nam' : 'Nữ'}\n- Cân nặng: ${userProfile.weight}kg\n- Chiều cao: ${userProfile.height}cm\n- Mức độ hoạt động: ${activityText}\n- Mục tiêu: ${goalText}\n- Calo mục tiêu: ${userProfile.targetCalories || 'Chưa tính'}kcal/ngày`
        : `\n\nUser Profile:\n- Age: ${userProfile.age}\n- Gender: ${userProfile.gender}\n- Weight: ${userProfile.weight}kg\n- Height: ${userProfile.height}cm\n- Activity Level: ${activityText}\n- Goal: ${goalText}\n- Target Calories: ${userProfile.targetCalories || 'Not calculated'}kcal/day`;
    }

    const guidelines = isVietnamese
      ? `\n\nHướng dẫn:\n- Luôn đưa ra lời khuyên an toàn và dựa trên khoa học\n- Cá nhân hóa gợi ý dựa trên thông tin người dùng\n- Đưa ra thông tin dinh dưỡng cụ thể khi có thể\n- Khuyến khích thói quen ăn uống lành mạnh\n- Nếu được hỏi về các vấn đề y tế nghiêm trọng, khuyên người dùng tham khảo chuyên gia\n- Trả lời bằng tiếng Việt`
      : `\n\nGuidelines:\n- Always provide safe, science-based advice\n- Personalize suggestions based on user profile\n- Include specific nutritional information when possible\n- Encourage healthy eating habits\n- For serious medical concerns, advise consulting healthcare professionals\n- Respond in English`;

    return basePrompt + profileInfo + guidelines;
  }

  async sendMessage(
    message: string,
    userProfile: UserProfile | null,
    chatHistory: ChatMessage[],
    language: string = 'en'
  ): Promise<string> {
    try {
      const systemPrompt = this.createSystemPrompt(userProfile, language);
      
      const messages = [
        new SystemMessage(systemPrompt),
        ...chatHistory.slice(-10).map(msg => 
          msg.sender === 'user' 
            ? new HumanMessage(msg.message)
            : new AIMessage(msg.message)
        ),
        new HumanMessage(message)
      ];

      const response = await this.model.invoke(messages);
      return await this.parser.invoke(response);
    } catch (error) {
      console.error('AI Service Error:', error);
      const errorMessage = language === 'vi' 
        ? 'Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau.'
        : 'Sorry, I\'m experiencing technical difficulties. Please try again later.';
      return errorMessage;
    }
  }

  async generateRecipe(
    ingredients: string[],
    mealType: string,
    userProfile: UserProfile | null,
    language: string = 'en'
  ): Promise<Recipe | null> {
    try {
      const isVietnamese = language === 'vi';
      
      const prompt = isVietnamese 
        ? `Tạo một công thức nấu ăn cho ${mealType} sử dụng các nguyên liệu: ${ingredients.join(', ')}.

Vui lòng trả về công thức theo định dạng JSON:
{
  "name": "tên món ăn",
  "ingredients": ["nguyên liệu 1", "nguyên liệu 2"],
  "instructions": ["bước 1", "bước 2"],
  "nutrition": {
    "calories": số_calo,
    "protein": số_gram_protein,
    "carbs": số_gram_carbs,
    "fat": số_gram_fat
  },
  "servings": số_khẩu_phần,
  "prepTime": thời_gian_phút,
  "difficulty": "easy/medium/hard",
  "tags": ["tag1", "tag2"]
}`
        : `Create a ${mealType} recipe using these ingredients: ${ingredients.join(', ')}.

Please return the recipe in JSON format:
{
  "name": "recipe name",
  "ingredients": ["ingredient 1", "ingredient 2"],
  "instructions": ["step 1", "step 2"],
  "nutrition": {
    "calories": calorie_number,
    "protein": protein_grams,
    "carbs": carbs_grams,
    "fat": fat_grams
  },
  "servings": serving_count,
  "prepTime": time_in_minutes,
  "difficulty": "easy/medium/hard",
  "tags": ["tag1", "tag2"]
}`;

      const response = await this.model.invoke([new HumanMessage(prompt)]);
      const result = await this.parser.invoke(response);
      
      // Try to parse JSON from response
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const recipeData = JSON.parse(jsonMatch[0]);
        return {
          id: Date.now().toString(),
          ...recipeData
        };
      }
      return null;
    } catch (error) {
      console.error('Recipe generation error:', error);
      return null;
    }
  }

  async generateMealPlan(
    days: number,
    userProfile: UserProfile | null,
    language: string = 'en'
  ): Promise<string> {
    try {
      const isVietnamese = language === 'vi';
      
      const prompt = isVietnamese
        ? `Tạo một kế hoạch bữa ăn ${days} ngày cho người có thông tin: ${userProfile ? `tuổi ${userProfile.age}, ${userProfile.gender === 'male' ? 'nam' : 'nữ'}, cân nặng ${userProfile.weight}kg, mục tiêu ${userProfile.goal}` : 'chưa có thông tin'}.

Bao gồm bữa sáng, trưa, tối cho mỗi ngày. Đưa ra gợi ý cụ thể và calo ước tính.`
        : `Create a ${days}-day meal plan for someone with profile: ${userProfile ? `age ${userProfile.age}, ${userProfile.gender}, weight ${userProfile.weight}kg, goal ${userProfile.goal}` : 'no profile available'}.

Include breakfast, lunch, and dinner for each day. Provide specific suggestions and estimated calories.`;

      const response = await this.model.invoke([new HumanMessage(prompt)]);
      return await this.parser.invoke(response);
    } catch (error) {
      console.error('Meal plan generation error:', error);
      const errorMessage = language === 'vi' 
        ? 'Không thể tạo kế hoạch bữa ăn. Vui lòng thử lại.'
        : 'Unable to generate meal plan. Please try again.';
      return errorMessage;
    }
  }

  async getCalorieInfo(
    foodName: string,
    quantity: string,
    language: string = 'en'
  ): Promise<string> {
    try {
      const isVietnamese = language === 'vi';
      
      const prompt = isVietnamese
        ? `Cho tôi biết thông tin dinh dưỡng của ${quantity} ${foodName}. Bao gồm calo, protein, carbs, chất béo.`
        : `Give me nutritional information for ${quantity} ${foodName}. Include calories, protein, carbs, and fat.`;

      const response = await this.model.invoke([new HumanMessage(prompt)]);
      return await this.parser.invoke(response);
    } catch (error) {
      console.error('Calorie info error:', error);
      const errorMessage = language === 'vi' 
        ? 'Không thể lấy thông tin dinh dưỡng. Vui lòng thử lại.'
        : 'Unable to get nutritional information. Please try again.';
      return errorMessage;
    }
  }
}

export const aiService = new AIService();
