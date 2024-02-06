/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import * as busboy from "busboy";
import * as cors from "cors";
// Start writing functions
// https://firebase.google.com/docs/functions/typescript

admin.initializeApp();

const corsHandler = cors({
  origin: ["https://test-project-413409.web.app", "https://test-project-413409.firebaseapp.com"],
});

export const helloWorld = onRequest(async (req, res) => {
  logger.log("Hello, World!");
  logger.log(`req ${req}`);
  res.status(200).send("Hello, World!");
});

// read
export const read = onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
    const db = admin.firestore();
    const storage = admin.storage();
    try {
      const querySnapshot = await db.collection("Test").get();
      const data = querySnapshot.docs.map((doc) => {
        const docData = doc.data();
        const imgUrl = docData.Image;
        const publicUrl = storage.bucket().file(imgUrl).publicUrl();
        return {text: docData.Text, imgUrl: publicUrl};
      });
      logger.log(data);
      res.status(200).send(data);
    } catch (error) {
      logger.error(error);
      res.status(500).send(error);
    }
  });
});

// write
export const write = onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
    const storage = admin.storage();
    const bucket = storage.bucket();
    const db = admin.firestore();
    try {
      let textValue;
      let fileName;
      const bb = busboy({headers: req.headers});
      const busboyPromise = new Promise<void>((resolve, reject) => {
        bb.on("field", (fieldname, val) => {
          if (fieldname === "text") {
            textValue = val;
          }
        });
        bb.on("file", (name, stream, info) => {
          fileName = info.filename;
          const filePath = bucket.file(fileName);
          stream
            .pipe(filePath.createWriteStream())
            .on("close", () => {
              resolve();
            })
            .on("error", (error) => {
              console.log("File processed error", error);
              reject(new Error("error" + error.toString()));
            });
        });
        bb.end(req.rawBody);
      });
      await busboyPromise;
      const querySnapshot = await db.collection("Test").get();
      logger.log(`querysnapshot length : ${querySnapshot.docs.length}`);
      logger.log(`data: {Text : ${textValue}, Image: ${fileName}}`);
      await admin.firestore()
        .collection("Test")
        .doc(querySnapshot.docs.length.toString())
        .create({"Text": textValue, "Image": fileName});
      res.status(200).send(`{message: success, 
        data: {Text : ${textValue}, Image: ${fileName}}}`);
    } catch (error) {
      logger.error(error);
      res.status(400).send(error);
    }
  });
});
