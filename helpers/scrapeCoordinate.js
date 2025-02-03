import axios from "axios";

export const scrapeCoordinate = async (location, city) => {
  try {
    //sleep for 3 seconds
    await new Promise((resolve) => setTimeout(resolve, 3000));
    const q = `${location.split(" ").join("%20")}%20${city
      .split(" ")
      .join("%20")}`;
    console.log(q);
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/search.php?q=${q}&polygon_geojson=1&format=jsonv2`
    );
    if (response.data.length > 0) {
      const coordinates = [
        parseFloat(response.data[0].lat),
        parseFloat(response.data[0].lon),
      ];
      console.log("coordinates1", coordinates);
      return coordinates;
    } else {
      const response2 = await axios.get(
        `https://nominatim.openstreetmap.org/search.php?q=${city
          .split(" ")
          .join("%20")}&polygon_geojson=1&format=jsonv2`
      );
      if (response2.data.length > 0) {
        const coordinates = [
          parseFloat(response2.data[0].lat),
          parseFloat(response2.data[0].lon),
        ];
        console.log("coordinates2", coordinates);
        return coordinates;
      }
      return [0, 0]; // Return default coordinates if no results found
    }
  } catch (error) {
    // console.error("Error fetching coordinates:", error);
    return [0, 0]; // Return default coordinates on error
  }
};
