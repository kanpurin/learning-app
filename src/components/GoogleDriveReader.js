/* global google, gapi */
import React, { useState, useEffect } from 'react';

const CLIENT_ID = '558469665888-hnbbtsbjcu3fvcr93m4jncrqajgeq2ee.apps.googleusercontent.com';
const API_KEY = 'AIzaSyCh3YHiMbNJfsSJrwm-YrmDjBLsUfs5_V0';
const SCOPE = "https://www.googleapis.com/auth/drive.readonly";
const DISCOVERY_DOCS = [
  "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest",
];

const GoogleDriveReader = ({ loadJSON, questions }) => {
  const [gapiLoaded, setGapiLoaded] = useState(false);
  const [pickerApiLoaded, setPickerApiLoaded] = useState(false);

  useEffect(() => {
    // GIS 認証用スクリプト
    const gisScript = document.createElement("script");
    gisScript.src = "https://accounts.google.com/gsi/client";
    gisScript.async = true;
    gisScript.defer = true;
    document.body.appendChild(gisScript);

    // GAPI 用スクリプト
    const gapiScript = document.createElement("script");
    gapiScript.src = "https://apis.google.com/js/api.js";
    gapiScript.onload = () => {
      gapi.load("client:picker", () => {
        setPickerApiLoaded(true);
        setGapiLoaded(true);
        gapi.client
          .init({
            apiKey: API_KEY,
            discoveryDocs: DISCOVERY_DOCS,
          })
          .catch(console.error);
      });
    };
    document.body.appendChild(gapiScript);
  }, []);

  const initTokenClient = () => {
    const client = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPE,
      callback: (response) => {
        if (response.access_token) {
          createPicker(response.access_token);
        }
      },
    });
    client.requestAccessToken();
  };

  const createPicker = (token) => {
    if (!pickerApiLoaded || !token) return;

    const view = new google.picker.DocsView()
      .setIncludeFolders(true)
      .setMimeTypes("application/json")
      .setSelectFolderEnabled(false);

    const picker = new google.picker.PickerBuilder()
      .enableFeature(google.picker.Feature.NAV_HIDDEN)
      .setOAuthToken(token)
      .setDeveloperKey(API_KEY)
      .addView(view)
      .setCallback(pickerCallback)
      .build();

    picker.setVisible(true);
  };

  const pickerCallback = async (data) => {
    if (data.action === google.picker.Action.PICKED) {
      if (questions.length > 0) {
        if (!window.confirm('既存の問題が上書きされます。続行しますか？')) {
          return;
        }
      }
      const fileId = data.docs[0].id;
      try {
        const result = await gapi.client.drive.files.get({
          fileId,
          alt: "media",
        });
        const jsonData = JSON.parse(result.body);
        loadJSON(jsonData, data.docs[0].name);
      } catch (e) {
        alert("ファイルの読み込みに失敗しました");
        console.error(e);
      }
    }
  };

  return (
    <button
      onClick={initTokenClient}
      className="form-control"
      disabled={!gapiLoaded || !pickerApiLoaded}
    >
      Google Drive から読み込む
    </button>
  );
};

export default GoogleDriveReader;
