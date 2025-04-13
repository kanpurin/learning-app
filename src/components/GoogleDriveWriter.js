/* global google, gapi */
import React, { useState, useEffect } from 'react';

const CLIENT_ID = '558469665888-hnbbtsbjcu3fvcr93m4jncrqajgeq2ee.apps.googleusercontent.com';
const API_KEY = 'AIzaSyCh3YHiMbNJfsSJrwm-YrmDjBLsUfs5_V0';
const SCOPE = 'https://www.googleapis.com/auth/drive';
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];

const GoogleDriveWriter = ({ questions, fileName }) => {
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
      .setSelectFolderEnabled(true);

    const picker = new google.picker.PickerBuilder()
      .enableFeature(google.picker.Feature.NAV_HIDDEN)
      .setOAuthToken(token)
      .setDeveloperKey(API_KEY)
      .addView(view)
      .setCallback(pickerCallback)
      .build();

    picker.setVisible(true);
  };

  // ピッカーで選択されたアイテムに応じて処理を分岐
  const pickerCallback = async (data) => {
    if (data.action === google.picker.Action.PICKED) {
      const pickedItem = data.docs[0];
      const mimeType = pickedItem.mimeType;
      const selectedId = pickedItem.id;
      const selectedFileName = fileName;

      try {
        if (mimeType === 'application/json') {
          // JSONファイルを上書き
          await updateFile(selectedId, selectedFileName);
        } else if (mimeType === 'application/vnd.google-apps.folder') {
          // フォルダに新規作成
          await createNewFile(selectedId, selectedFileName);
        } else {
          alert('対応していないファイルタイプです');
        }
      } catch (error) {
        alert('ファイルのアップロードに失敗しました');
        console.error(error);
      }
    }
  };

  
  // 上書き用関数
  const updateFile = async (fileId) => {
    const jsonData = JSON.stringify(questions, null, 2);
    const utf8ToBase64 = (str) => btoa(unescape(encodeURIComponent(str)));

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      delimiter +
      'Content-Type: application/json\r\n' +
      'Content-Transfer-Encoding: base64\r\n\r\n' +
      utf8ToBase64(jsonData) +
      closeDelimiter;

    try {
      const response = await gapi.client.request({
        path: `/upload/drive/v3/files/${fileId}`,
        method: 'PATCH',
        params: { uploadType: 'multipart' },
        headers: {
          'Content-Type': `multipart/related; boundary="${boundary}"`,
        },
        body: multipartRequestBody,
      });

      alert('ファイルがアップロードされました！');
    } catch (error) {
      alert('ファイルのアップロードに失敗しました');
    }
  };

  // 新規ファイルを作成する関数
  const createNewFile = async (folderId, fileName) => {
    const jsonData = JSON.stringify(questions, null, 2);
    const utf8ToBase64 = (str) => btoa(unescape(encodeURIComponent(str)));
  
    const metadata = {
      name: fileName || 'questions.json',
      mimeType: 'application/json',
      parents: [folderId],
    };
  
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;
  
    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n' +
      'Content-Transfer-Encoding: base64\r\n\r\n' +
      utf8ToBase64(jsonData) +
      closeDelimiter;
  
    try {
      const response = await gapi.client.request({
        path: '/upload/drive/v3/files',
        method: 'POST',
        params: { uploadType: 'multipart' },
        headers: {
          'Content-Type': `multipart/related; boundary="${boundary}"`,
        },
        body: multipartRequestBody,
      });
  
      alert('ファイルがアップロードされました！');
    } catch (error) {
      alert('ファイルのアップロードに失敗しました');
    }
  };

  return (
    <div>
      {/* Google Driveにファイルを保存するボタン */}
      <button
        onClick={initTokenClient} // ボタンクリックで認証→ピッカー表示→ファイルアップロード
        className="btn btn-primary form-control"
        disabled={!gapiLoaded || !pickerApiLoaded}
      >
        Google Drive に保存
      </button>
    </div>
  );
};

export default GoogleDriveWriter;