import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    let uri = process.env.MONGO_URI;
    if (!uri) {
      throw new Error("MONGO_URI is not defined in your environment variables");
    }

    // Safely URL-encode credentials if they contain special characters (like '@' in password)
    try {
      let prefix = "";
      let remaining = uri;
      if (uri.startsWith("mongodb+srv://")) {
        prefix = "mongodb+srv://";
        remaining = uri.slice(14);
      } else if (uri.startsWith("mongodb://")) {
        prefix = "mongodb://";
        remaining = uri.slice(10);
      }

      if (prefix) {
        const endOfAuthority = remaining.search(/[\/\?]/);
        let authority = endOfAuthority === -1 ? remaining : remaining.slice(0, endOfAuthority);
        const pathAndQuery = endOfAuthority === -1 ? "" : remaining.slice(endOfAuthority);
        const lastAtIndex = authority.lastIndexOf("@");
        if (lastAtIndex !== -1) {
          const credentials = authority.slice(0, lastAtIndex);
          const host = authority.slice(lastAtIndex + 1);
          const colonIndex = credentials.indexOf(":");
          if (colonIndex !== -1) {
            const username = credentials.slice(0, colonIndex);
            const password = credentials.slice(colonIndex + 1);
            // Only encode if it has raw unencoded characters (avoid double-encoding)
            const decodedPassword = decodeURIComponent(password);
            const encodedPassword = encodeURIComponent(decodedPassword);
            const decodedUsername = decodeURIComponent(username);
            const encodedUsername = encodeURIComponent(decodedUsername);
            authority = `${encodedUsername}:${encodedPassword}@${host}`;
          }
          uri = `${prefix}${authority}${pathAndQuery}`;
        }
      }
    } catch (e) {
      // Fallback to original URI if parsing fails
    }

    const conn = await mongoose.connect(uri);
    console.log("Database is connected");
    return conn;
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    // Exit the process with failure code 1 so you know immediately 
    // that the app failed to start due to the database.
    process.exit(1); 
  }
};
