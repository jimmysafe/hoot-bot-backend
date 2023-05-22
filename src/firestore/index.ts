import admin from "firebase-admin";
import config from "./config.json";
import * as fireorm from "fireorm";

export function initialize() {
  admin.initializeApp({
    credential: admin.credential.cert(config as any),
    databaseURL: `https://${config.project_id}.firebaseio.com`,
  });

  const firestore = admin.firestore();

  fireorm.initialize(firestore);
}
