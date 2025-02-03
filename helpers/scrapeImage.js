import {
  GOOGLE_IMG_SCRAP,
  GOOGLE_IMG_INVERSE_ENGINE_URL,
  GOOGLE_IMG_INVERSE_ENGINE_UPLOAD,
  GOOGLE_QUERY,
} from "google-img-scrap";

export async function getImages(recommendation) {
  console.log("🚀 ~ getting images...");
  const newRecommendation = await Promise.all([
    (async () => {
      const itinerariesWithImages = await Promise.all(
        recommendation.itineraries.map(async (itinerary) => {
          const locationsWithImages = await Promise.all(
            itinerary.locations.map(async (location) => {
              const image = await GOOGLE_IMG_SCRAP({
                search: `${location.name} ${recommendation.city}`,
                limit: 1,
              });
              return {
                ...location,
                image: image.result[0].url,
              };
            })
          );
          return {
            ...itinerary,
            locations: locationsWithImages,
          };
        })
      );
      return {
        ...recommendation,
        itineraries: itinerariesWithImages,
      };
    })(),
  ]);
  return newRecommendation[0];
}
export async function getCityImages(recommendations) {
  console.log("🚀 ~ getting images...");
  const newRecommendations = await Promise.all(
    recommendations.map(async (recommendation) => {
      const cityImage = await GOOGLE_IMG_SCRAP({
        search: `${recommendation.city} famous landmarks agoda`,
        limit: 1,
      });
      return {
        ...recommendation,
        cityImage: cityImage.result[0].url,
      };
    })
  );
  return newRecommendations;
}
