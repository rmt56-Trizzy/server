import axios from "axios";
import { config } from "dotenv";

// export const scrapeCoordinate = async (location, city, country) => {
//   //sleep for 3 seconds
//   await new Promise((resolve) => setTimeout(resolve, 3000));

//   const queries = [
//     `${location.split(" ").join("%20")}%20${city.split(" ").join("%20")}`,
//     `${location.split(" ").join("%20")}`,
//     `${city.split(" ").join("%20")}%20${country.split(" ").join("%20")}`,
//   ];

//   for (const query of queries) {
//     await new Promise((resolve) => setTimeout(resolve, 1000));
//     const response = await axios.get(
//       `https://nominatim.openstreetmap.org/search.php?q=${query}&polygon_geojson=1&format=jsonv2`
//     );
//     if (response.data.length > 0) {
//       const coordinates = [
//         parseFloat(response.data[0].lat),
//         parseFloat(response.data[0].lon),
//       ];
//       console.log("coordinates", coordinates);
//       return coordinates;
//     }
//   }

// const response1 = await axios.get(
//   `https://nominatim.openstreetmap.org/search.php?q=${location
//     .split(" ")
//     .join("%20")}&polygon_geojson=1&format=jsonv2`
// );
// if (response1.data.length > 0) {
//   const coordinates = [
//     parseFloat(response1.data[0].lat),
//     parseFloat(response1.data[0].lon),
//   ];
//   console.log("coordinates1", coordinates);
//   return coordinates;
// } else {
//   const q = `${location.split(" ").join("%20")}%20${city
//     .split(" ")
//     .join("%20")}`;
//   console.log(q);
//   const response2 = await axios.get(
//     `https://nominatim.openstreetmap.org/search.php?q=${q}&polygon_geojson=1&format=jsonv2`
//   );
//   if (response2.data.length > 0) {
//     const coordinates = [
//       parseFloat(response2.data[0].lat),
//       parseFloat(response2.data[0].lon),
//     ];
//     console.log("coordinates2", coordinates);
//     return coordinates;
//   } else {
//     const response3 = await axios.get(
//       `https://nominatim.openstreetmap.org/search.php?q=${city
//         .split(" ")
//         .join("%20")}&polygon_geojson=1&format=jsonv2`
//     );
//     if (response3.data.length > 0) {
//       const coordinates = [
//         parseFloat(response3.data[0].lat),
//         parseFloat(response3.data[0].lon),
//       ];
//       console.log("coordinates3", coordinates);
//       return coordinates;
//     }
//     return [0, 0]; // Return default coordinates if no results found
//   }
// }
// };

export const scrapeCoordinate = async (location, city, country) => {
  const queries = [
    `${location.split(" ").join("%20")}%20${city.split(" ").join("%20")}`,
    `${location.split(" ").join("%20")}`,
    `${city.split(" ").join("%20")}%20${country.split(" ").join("%20")}`,
  ];

  for (const q of queries) {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${q}&key=${process.env.GOOGLE_MAPS_API_KEY}`
    );
    if (response.data.results.length > 0) {
      const coordinates = [
        response.data.results[0].geometry.location.lat,
        response.data.results[0].geometry.location.lng,
      ];
      console.log("coordinates", coordinates);
      return coordinates;
    }
  }
};
