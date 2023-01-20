import React, {Fragment, Component} from 'react';
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
import ImagePicker from 'react-native-image-picker';
import * as tf from '@tensorflow/tfjs';
import { fetch, decodeJpeg, bundleResourceIO } from '@tensorflow/tfjs-react-native';
import { useEffect } from 'react';
import { useState } from 'react';


const FaceMesh = () => {

  const [image, setImage] = useState(null);
  const [model, setModel] = useState(null);
  const [predictions, setPredictions] = useState(null);
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

  const predict = async () => {
    try {
      const imageAssetPath = Image.resolveAssetSource(image);
      const response = await fetch(imageAssetPath.uri, {}, { isBinary: true });
      const rawImageData = await response.arrayBuffer();
      const imageTensor = decodeJpeg(rawImageData);
      const predictions = await model.predict(imageTensor);
      console.log(predictions);
      setPredictions(predictions);
    } catch (error) {
      console.log(error);
    }
  }


  // create a function to take image from camera
  const cameraLaunch = () => {
    let options = {
      storageOptions: {
        skipBackup: true,
        path: 'images',
      },
    };
    ImagePicker.launchCamera(options, (response) => {
      console.log('Response = ', response);
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
      } else if (response.customButton) {
        console.log('User tapped custom button: ', response.customButton);
        alert(response.customButton);
      } else {
        const source = { uri: response.uri };
        console.log(source);
        setImage(source);

        // predict();

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
          <View style={styles.ImageSections}>
            {renderFileUri()}

          </View>
          <View style={styles.btnParentSection}>
            <TouchableOpacity

              style={styles.btnSection}
              onPress={cameraLaunch}>
              <Text style={styles.btnText}>Launch Camera</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Fragment>

  )
  
}

export default FaceMesh