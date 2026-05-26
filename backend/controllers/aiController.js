import { GoogleGenerativeAI } from "@google/generative-ai";
import Habit from "../models/Habit.js";
import Log from "../models/Log.js";

// Initialize Gemini API client if API key is present
let genAI = null;
let aiModel = null;
if (process.env.GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    aiModel = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-2.5-flash" });
  } catch (err) {
    console.error("Failed to initialize Gemini AI client:", err.message);
  }
}

// Helper to query Gemini with dynamic fallback
const generateAIResponse = async (prompt, fallbackText) => {
  if (aiModel) {
    try {
      const result = await aiModel.generateContent(prompt);
      const text = result.response.text().trim();
      if (text) return text;
    } catch (err) {
      console.warn("Gemini generation failed. Using local fallback. Error:", err.message);
    }
  }
  return typeof fallbackText === "function" ? fallbackText() : fallbackText;
};

// @desc    Get morning motivation
// @route   GET /api/ai/morning
// @access  Private
export const getMorningMotivation = async (req, res) => {
  try {
    const user = req.user;
    const habits = await Habit.find({ userId: user._id, isArchived: false });
    
    const prompt = `
      You are an expert AI Life Coach. The user's name is "${user.name}".
      They currently have ${habits.length} active habits they are tracking: ${habits.map((h) => h.name).join(", ")}.
      
      Generate a short, powerful, inspiring morning motivation greeting.
      Format your response exactly as a single paragraph. Make it energetic, encouraging, and personal. Keep it under 60 words.
    `;

    const fallback = () => {
      const quotes = [
        "Every morning is a clean slate to build your streaks.",
        "Your future self is created by what you do today.",
        "Small daily habits accumulate into massive life outcomes.",
        "Energy flows where attention goes. Focus on your routines today!"
      ];
      const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
      return `Good morning, ${user.name}! Today is a beautiful opportunity to build your momentum. Let's make progress on your habits: ${habits.map((h) => h.name).slice(0, 3).join(", ") || "daily goals"}. Remember: ${randomQuote}`;
    };

    const motivation = await generateAIResponse(prompt, fallback);
    res.json({ content: motivation });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get weekly performance report
// @route   POST /api/ai/weekly-report
// @access  Private
export const getWeeklyReport = async (req, res) => {
  try {
    const habits = await Habit.find({ userId: req.user._id });
    const logs = await Log.find({ userId: req.user._id });
    
    const habitStats = habits.map(h => {
      const count = logs.filter(l => l.habitId.toString() === h._id.toString()).length;
      return `${h.name} (${count} completions)`;
    }).join(", ");

    const prompt = `
      You are a supportive, insightful habit analyst coach. 
      Generate a comprehensive "Weekly Performance Report" for the user "${req.user.name}".
      Here are the habits they have been tracking and their total completion counts in their history:
      ${habitStats || "No habits tracked yet."}

      Create a well-formatted performance report in markdown. Keep it engaging, professional, and actionable.
      Analyze what they did well, note any habits that need a little extra love, and provide 3 concrete, personalized, and scientific habit-building suggestions for next week.
    `;

    const fallback = `
### 📊 Weekly Performance Report for **${req.user.name}**

We've analyzed your progress across all habits, and here are your personalized coaching insights:

#### 🌟 Key Wins & Strong Areas
* You are showing good consistency with your overall habit tracker dashboard!
* Engaging with your routines represents a major step forward in building healthy momentum.

#### 📈 Focus Areas & Opportunities
* Remember that habit formation is non-linear. If you've missed a few days, focus on the rule: **"Never miss twice."**
* Try to link your habits (Habit Stacking) to make them frictionless to execute (e.g. *"Immediately after pouring my morning coffee, I will sit down for my mindfulness routine."*)

#### 🎯 Coaching Recommendations for Next Week
1. **Optimize Your Environment**: Make the cues for your good habits highly visible, and hide the cues for your bad ones.
2. **Start Small**: Reduce your habits down to their "2-minute versions" on days when you feel low on energy.
3. **Be Compassionate**: Consistency beats perfection. Getting back on track immediately is what defines success!
    `.trim();

    const report = await generateAIResponse(prompt, fallback);
    res.json({ content: report });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get recovery plan for a broken streak
// @route   POST /api/ai/recovery-plan
// @access  Private
export const getRecoveryPlan = async (req, res) => {
  try {
    const { habitId } = req.body;
    if (!habitId) {
      return res.status(400).json({ message: "Habit ID is required" });
    }

    const habit = await Habit.findOne({ _id: habitId, userId: req.user._id });
    if (!habit) {
      return res.status(404).json({ message: "Habit not found" });
    }

    const prompt = `
      You are an expert behavior scientist. The user "${req.user.name}" has broken their streak for their habit: "${habit.name}".
      Description of habit: "${habit.description || "none"}".
      
      Generate a short, highly motivating, and scientific 3-step recovery plan to help them get back on track and restart their streak tomorrow.
      Format the response in markdown, starting with a supportive opening sentence. Keep it extremely actionable and concise.
    `;

    const fallback = `
### ⚡ Streak Recovery Plan: **${habit.name}**

*Hey ${req.user.name}, breaking a streak is just a normal part of the habit-building loop—what matters is how you restart today! Here is your science-backed recovery strategy:*

1. **Reduce the Friction**: Shrink the habit down to a "micro-habit" today. If your goal was to study for 1 hour, commit to studying for just **2 minutes** today. Getting started is 90% of the battle.
2. **Anchor with Habit Stacking**: Place this habit immediately after a solid, existing anchor routine in your day (e.g. *"Immediately after I brush my teeth, I will perform my ${habit.name} routine"*).
3. **Establish a Reward**: Reward yourself immediately after completing it today to reinforce the neurological habit loop in your brain.
    `.trim();

    const plan = await generateAIResponse(prompt, fallback);
    res.json({ content: plan });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Suggest habits based on focus
// @route   POST /api/ai/suggest-habits
// @access  Private
export const getSuggestedHabits = async (req, res) => {
  try {
    const { focus } = req.body;
    const focusArea = focus || "Productivity & Health";

    const prompt = `
      Suggest 3 healthy, premium habits that a user named "${req.user.name}" could track under the focus area of "${focusArea}".
      
      For each suggested habit, provide:
      - Name
      - Description (under 15 words)
      - Category (e.g. Health, Productivity, Mindfulness)
      - Suggested Icon (a single emoji)
      - Suggested Color (a sleek hex color like #6366f1)
      
      Format the response as a JSON array of objects, containing properties: name, description, category, icon, color.
      Do not include any markdown styling, backticks, or text outside the JSON block.
    `;

    const fallback = () => {
      const suggestionsMap = {
        Health: [
          { name: "Hydrate Fully", description: "Drink a large glass of water immediately upon waking.", category: "Health", icon: "💧", color: "#3b82f6" },
          { name: "Daily Stretches", description: "Do a light 5-minute full body stretch.", category: "Health", icon: "🧘", color: "#10b981" },
          { name: "Active Walks", description: "Take a 15-minute brisk walk after lunch.", category: "Health", icon: "🚶", color: "#f59e0b" }
        ],
        Productivity: [
          { name: "Deep Work Block", description: "Work without distraction for 25 minutes.", category: "Productivity", icon: "⏱️", color: "#6366f1" },
          { name: "Daily Planner Review", description: "Review and list top 3 priorities for tomorrow.", category: "Productivity", icon: "📓", color: "#8b5cf6" },
          { name: "Inbox Zero", description: "Clean and organize your tasks/emails daily.", category: "Productivity", icon: "📥", color: "#ec4899" }
        ]
      };

      const key = suggestionsMap[focusArea] ? focusArea : "Health";
      return suggestionsMap[key];
    };

    let result = await generateAIResponse(prompt, null);
    let suggestions = [];
    if (result) {
      try {
        // Strip markdown if AI returned markdown JSON
        const sanitized = result.replace(/```json|```/g, "").trim();
        suggestions = JSON.parse(sanitized);
      } catch (err) {
        console.warn("Failed to parse AI suggestions JSON. Using fallback.");
        suggestions = fallback();
      }
    } else {
      suggestions = fallback();
    }

    res.json({ suggestions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper to generate a highly personalized, science-backed dynamic fallback response matching the user's specific query if Gemini fails.
const getDynamicCoachingFallback = (question, userName = "there", habits = []) => {
  const q = question.toLowerCase();
  
  const habitsStr = habits.length > 0 
    ? `your active routines like **${habits.join(", ")}**` 
    : "your daily habits";

  if (q.includes("streak") || q.includes("fail") || q.includes("miss") || q.includes("broken") || q.includes("lose") || q.includes("stop") || q.includes("motivation") || q.includes("consistent") || q.includes("consistency")) {
    return `
Hello **${userName}**! 

I completely understand — maintaining streaks can be tough, and missing a day can feel incredibly demotivating. Let's tackle this with behavioral science:

1. **The "Never Miss Twice" Rule**: Missing one day is an accident. Missing two days is the start of a new, negative routine. If you can't do the full habit today, do a **1-minute version** of it. Just showing up keeps the neurological pathway active!
2. **Reduce Friction**: Shrink your habit down so it is too small to fail. For example, if you missed your exercise routine, just commit to doing 5 jumping jacks or putting on your gym shoes.
3. **Re-anchor**: Place the cue for ${habitsStr} somewhere you literally cannot miss it.

You've got this! Restarting today is what defines a successful habit builder. Let's make tomorrow a win!
    `.trim();
  }

  if (q.includes("morning") || q.includes("routine") || q.includes("wake") || q.includes("start") || q.includes("day")) {
    return `
Hello **${userName}**! 

Designing a great morning routine is one of the most high-leverage steps you can take for your personal growth. Here is a science-backed architecture:

1. **Habit Stacking**: Attach your new habit directly onto an existing, solid anchor. Use the formula: *"After I [Anchor], I will immediately [New Habit]."* (e.g., *"After I pour my morning coffee, I will open my planner."*)
2. **Protect the First Hour**: Keep the first 30-60 minutes of your day free from reactive inputs (like checking your email or social media). Instead, dedicate it to proactive routines.
3. **Make the Cue Obvious**: If you want to track ${habits.length > 0 ? habits[0] : "a daily routine"}, place a physical reminder (like a journal, shoes, or a full water glass) in your direct line of sight.

Let's start micro tomorrow morning! What is the single easiest morning habit you want to lock in?
    `.trim();
  }

  if (q.includes("loop") || q.includes("cue") || q.includes("reward") || q.includes("water") || q.includes("hydrate")) {
    return `
Hello **${userName}**! 

Every single habit is governed by a simple three-step neurological loop. Understanding this loop allows you to architect any routine:

1. **The Cue (Trigger)**: This must be highly obvious. If you are tracking water hydration, keep a beautiful, full water bottle sitting right next to your computer screen or phone.
2. **The Routine (Action)**: This must be incredibly friction-free. Drink just one sip. Make the entry point tiny.
3. **The Reward (Neurological Reinforcement)**: Your brain needs to associate the habit with pleasure. Celebrate immediately! Give yourself a mental high-five, or tick off the box on your **AI Habit Tracker** dashboard to trigger that satisfying click and progress ring growth.

By optimizing these three elements for ${habitsStr}, consistency will become natural!
    `.trim();
  }

  if (q.includes("time") || q.includes("long") || q.includes("day") || q.includes("week") || q.includes("month") || q.includes("limit")) {
    return `
Hello **${userName}**! 

A very common myth is that habits take exactly 21 days to form. Behavioral science shows it actually takes anywhere from **18 to 254 days** (averaging about 66 days) depending on complexity!

Here is how you can speed up this automation process:
1. **Focus on Frequency, Not Intensity**: Doing a habit every single day for 2 minutes is much more effective for automaticity than doing it for 2 hours once a week.
2. **Perform at the Same Time**: Try to perform your active goals at a consistent time of day so the context itself becomes a prompt.
3. **Log it Instantly**: Tracking your progress triggers a tiny spike of dopamine, speed-tracking habit adoption.

Be patient with yourself as you build ${habitsStr}. Every check-off is a vote for the person you want to become!
    `.trim();
  }

  // Default general coaching fallback
  return `
Hello **${userName}**! 

That is an excellent question. Building consistent habits is all about building reliable systems, not relying on fleeting willpower. 

Here is my core coaching advice for you:
1. **Start Micro (The 2-Minute Rule)**: Scale down your goals. If you want to read 1 hour, start with 2 pages. Always choose consistency first, intensity second.
2. **Design Your Environment**: If you want to stay consistent with ${habitsStr}, make the cues highly visible and remove distractions.
3. **Never Miss Twice**: Missing one day is an accident; missing two is the birth of a new bad habit. Always prioritize doing a smaller version of the habit over skipping it completely.

Let's make today count! Do you want to discuss a specific strategy for any of your active habits?
  `.trim();
};

// @desc    AI Chat coach conversation
// @route   POST /api/ai/chat
// @access  Private
export const chatWithCoach = async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ message: "Question is required" });
    }

    const habits = await Habit.find({ userId: req.user._id, isArchived: false });
    const habitsList = habits.map(h => h.name);

    const prompt = `
      You are an elite, highly supportive, and empathetic AI Habit Coach. 
      The user "${req.user.name}" is asking: "${question}".
      For context, they are currently tracking these active habits: ${habitsList.join(", ") || "none yet"}.
      
      Respond as their friendly, motivational coach. Give them a highly actionable, structured, and science-backed answer.
      Format using markdown. Keep your answer encouraging and under 150 words.
    `;

    const fallback = () => getDynamicCoachingFallback(question, req.user.name, habitsList);

    const answer = await generateAIResponse(prompt, fallback);
    res.json({ content: answer });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    AI Public Chat coach conversation (for landing page/guests)
// @route   POST /api/ai/public-chat
// @access  Public
export const publicChatWithCoach = async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ message: "Question is required" });
    }

    const prompt = `
      You are an elite, highly supportive, and empathetic AI Habit Coach. 
      A visitor on our AI Habit Tracker website is asking: "${question}".
      They are currently exploring the website and want advice or have questions about building healthy habits.
      
      Respond as their friendly, motivational coach. Give them a highly actionable, structured, and science-backed answer.
      Briefly mention how an AI-powered Habit Tracker (like this website) can help them stay consistent, see streaks, and recover broken streaks.
      Format using markdown. Keep your answer encouraging and under 120 words.
    `;

    const fallback = () => getDynamicCoachingFallback(question, "there", []);

    const answer = await generateAIResponse(prompt, fallback);
    res.json({ content: answer });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


