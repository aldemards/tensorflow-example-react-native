import React, {Fragment, Component} from 'react';
import RNFS from 'react-native-fs';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  StatusBar,
  Image,
  Dimensions,
  TouchableOpacity,
} from 'react-native';


// import react-native-image-picker
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import * as tf from '@tensorflow/tfjs';
import { fetch, bundleResourceIO } from '@tensorflow/tfjs-react-native';
import { useEffect } from 'react';
import { useState } from 'react';
import * as base64 from 'base64-js'
import * as FileSystem from 'expo-file-system';


const FaceMesh = () => {

  const [image, setImage] = useState(null);
  const [model, setModel] = useState(null);
  const [result, setResult] = useState(null);
  const [fileUri, setFileUri] = useState(null);

  useEffect(() => {
    
    console.log('mounted')
    const loadModel = async () => {
      try {
        const modelJson = require('../assets/facemesh_data/model.json');  // model.json
        const modelWeights = require('../assets/facemesh_data/group1-shard1of1.bin'); // group1-shard1of1.bin
        await tf.ready();
        console.log('tf ready');
        const model = await tf.loadLayersModel(bundleResourceIO(modelJson, modelWeights));
        setModel(model);
        console.log('model loaded');
      } catch (error) {
        console.log(error);
      }
    }
    loadModel();
    return () => {
      console.log('unmounting') 
    }
  }, [])

  const performClassification = async () => {
    try {
      console.log('performing classification');
      console.log('fileUri', fileUri);
      if (!fileUri) {
        console.log("fileUri is null or undefined");
        return;
      }
      let uri = '';
      if (typeof fileUri === 'string') {
        if(fileUri.startsWith('file://')){
          uri = fileUri.slice(7);
        }else {
          uri = fileUri;
        }
      } else {
        uri = fileUri.uri;
      }
      const imgB64 = await FileSystem.readAsStringAsync(fileUri, {
          encoding: FileSystem.EncodingType.Base64,
      });
      const imgBuffer = tf.util.encodeString(imgB64, 'base64').buffer;
      const raw = new Uint8Array(imgBuffer)  
      const imageTensor = decodeJpeg(raw);
      console.log('imageTensor');
      // conver image in image of cropped face with 25% margin on each side and size 192x192 px to predict
      const croppedImage = tf.image.resizeBilinear(imageTensor, [192, 192]);
      console.log('croppedImage');
      const croppedImageWithMargin = tf.image.resizeBilinear(croppedImage, [224, 224]);
      console.log('croppedImageWithMargin');
      const normalizedImage = croppedImageWithMargin.div(255.0);
      const reshapedImage = normalizedImage.reshape([1, 224, 224, 3]);
      const prediction = await model.predict(reshapedImage);
      const predictionArray = prediction.arraySync()[0];
      console.log('predictionArray', predictionArray);
      setResult(predictionArray);


    } catch (error) {
      console.log(error);
    }
  }


  const chooseImage = () => {
    let options = {
      title: 'Select Image',
      storageOptions: {
        skipBackup: true,
        path: 'images',
      },
    };

    launchImageLibrary(options, response => {
      console.log('Response = ', response);
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if(response.assets && response.assets[0] && response.assets[0].uri) {
        console.log('response', JSON.stringify(response));
        setFileUri(
          response.assets[0].uri,
        );
        performClassification();
      } else {
          console.log('Error: Invalid image data');
      }
    });
  };

  

  // create launchCamera function with image picker

  const launchCamerapress = () => {
    let options = {
      storageOptions: {
        skipBackup: true,
        path: 'images',
      },
    };
    launchCamera(options, response => {
      console.log('Response = ', response);
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else {
        console.log('response', JSON.stringify(response));
        setFileUri(response.assets[0].uri);
        //this.performClassification();
      }
    });
  };



  const renderFileUri= () =>{
    if (fileUri) {
      return <Image source={{uri:fileUri}} style={styles.images} />;
    } else {
      return (
        <Image
          source={{
            uri: 'https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png',
          }}
          style={styles.images}
        />
      );
    }
  }

  const styles = StyleSheet.create({
    scrollView: {
      backgroundColor: 'white',
    },
  
    body: {
      backgroundColor: 'white',
      justifyContent: 'center',
      borderColor: 'black',
      borderWidth: 1,
      height: Dimensions.get('screen').height - 20,
      width: Dimensions.get('screen').width,
    },
    ImageSections: {
      display: 'flex',
      flexDirection: 'row',
      paddingHorizontal: 8,
      paddingVertical: 8,
      justifyContent: 'center',
    },
    images: {
      width: 250,
      height: 250,
      borderColor: 'black',
      borderWidth: 1,
      marginHorizontal: 3,
    },
    btnParentSection: {
      alignItems: 'center',
      marginTop: 10,
    },
    btnSection: {
      width: 225,
      height: 50,
      backgroundColor: '#DCDCDC',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 3,
      marginBottom: 10,
    },
    btnText: {
      textAlign: 'center',
      color: 'gray',
      fontSize: 14,
      fontWeight: 'bold',
    },
  });

  return (
    <Fragment>
    <StatusBar barStyle="dark-content" />
    <SafeAreaView>
      <View style={styles.body}>
        <Text
          style={{textAlign: 'center', fontSize: 20, paddingBottom: 10}}>
          Pick Images from Camera & Gallery
        </Text>
        <View style={styles.ImageSections}>
          <View>{renderFileUri()}</View>
        
        </View>
        <Text style={{textAlign:'center'}}>{result}</Text>
        <View style={styles.btnParentSection}>
          <TouchableOpacity
            onPress={chooseImage}
            style={styles.btnSection}>
            <Text style={styles.btnText}>Choose File</Text>
          </TouchableOpacity>
          

          <TouchableOpacity
            onPress={launchCamerapress}
            style={styles.btnSection}>
            <Text style={styles.btnText}>Directly Launch Camera</Text>
          </TouchableOpacity>

        </View>
      </View>
    </SafeAreaView>
  </Fragment>

  )
  
}

export default FaceMesh