import "dotenv/config";

export const pplxRequestCities = async (chat) => {
  const options = {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      authorization: `Bearer ${process.env.PPLX_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.1-sonar-small-128k-online",
      messages: [
        {
          role: "system",
          content: `you are a travel agent. the user will give you his/her trip preferences. you should suggest 6 Major Cities that would fit the user's preferences. return the result in json format such as follows.
          [{"city": "Jakarta","country": "Indonesia","countryCode": "ID"]
          return only the JSON`,
        },
        { role: "user", content: chat },
      ],
    }),
  };

  try {
    const response = await fetch(
      "https://api.perplexity.ai/chat/completions",
      options
    );
    const result = await response.json();
    return result.choices[0].message.content;
  } catch (err) {
    console.log(err);
  }
};

export const pplxRequestItineraries = async (chat) => {
  const options = {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      authorization: `Bearer ${process.env.PPLX_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.1-sonar-small-128k-online",
      messages: [
        {
          role: "system",
          content: `you are a travel agent. the user will give you his/her trip preferences. you should create itineraries for the requested length of stay that would fit the user's preferences. Each day, I would like to visit 2 famous places in morning, 2 famous places in afternoon. Please try to group the locations by distance, so I can minimize the travel distance each day. Please provide real information about the location coordinates from google maps. return the result in json format such as follows.
          [{"city": "Jakarta","country": "Indonesia","countryCode": "ID","itineraries":[{"day": "Day 1", "locations":[{"slug": "monas","name": "Monas", "category": "Architectural Buildings", "coordinates": [-6.1753924, 106.8271528]},{"slug": "cafe-batavia","name": "Cafe Batavia", "category": "Cafe", "coordinates": [-6.1351, 106.8133]}]}]}]
          return only the JSON`,
        },
        { role: "user", content: chat },
      ],
    }),
  };

  try {
    const response = await fetch(
      "https://api.perplexity.ai/chat/completions",
      options
    );
    const result = await response.json();
    return result.choices[0].message.content;
  } catch (err) {
    console.log(err);
  }
};

export const pplxRequestChat1 = async (chat) => {
  const options = {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      authorization: `Bearer ${process.env.PPLX_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.1-sonar-small-128k-online",
      messages: [
        {
          role: "system",
          content: `you are Velzy, a travel agent chat bot. Your task is to ask the user about their travel preferences. First greet the user, introduce your self, and ask if you can help him/her. Keep if short and simple. For example, Hello My name is Velzy, and I'm here to help you plan your next trip. How can I assist you today? Let me know, and I'll do my best to tailor a travel plan just for you`,
        },
        { role: "user", content: chat },
      ],
    }),
  };

  try {
    const response = await fetch(
      "https://api.perplexity.ai/chat/completions",
      options
    );
    const result = await response.json();
    return result.choices[0].message.content;
  } catch (err) {
    console.log(err);
  }
};

export const pplxRequestChat2 = async (chat) => {
  const options = {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      authorization: `Bearer ${process.env.PPLX_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.1-sonar-small-128k-online",
      messages: [
        {
          role: "system",
          content: `you are Velzy, a travel agent chat bot. Your task is to ask the user about their travel preferences. Based on the following questions, check whether the user has answered the question or not. If not then ask the appropriate question to get the best user preferences. 1. Which continent or region are you interested to explore? 2. What kind of places or activities are you interested to visit or to try? 3. How many days are you planning for your travel? 4. Anything else you would like to add to your travel plan? If the user has answered the question, then ask the next question. If the user has not answered the question, then ask the question.ONLY ASK 1 question at a time.`,
        },
        { role: "user", content: chat },
      ],
    }),
  };

  try {
    const response = await fetch(
      "https://api.perplexity.ai/chat/completions",
      options
    );
    const result = await response.json();
    return result.choices[0].message.content;
  } catch (err) {
    console.log(err);
  }
};
