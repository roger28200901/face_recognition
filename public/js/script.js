const video = document.getElementById('videoInput')

Promise.all([
    //載入訓練好的模型（weight，bias）
    // ageGenderNet 識別性別和年齡
    // faceExpressionNet 識別表情,開心，沮喪，普通
    // faceLandmark68Net 識別臉部特徵用於mobilenet演算法
    // faceLandmark68TinyNet 識別臉部特徵用於tiny演算法
    // faceRecognitionNet 識別人臉
    // ssdMobilenetv1 google開源AI演算法除庫包含分類和線性迴歸
    // tinyFaceDetector 比Google的mobilenet更輕量級，速度更快一點
    // mtcnn  多工CNN演算法，一開瀏覽器就卡死
    // tinyYolov2 識別身體輪廓的演算法，不知道怎麼用
    faceapi.nets.faceRecognitionNet.loadFromUri('../public/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('../public/models'),
    faceapi.nets.ssdMobilenetv1.loadFromUri('../public/models') //heavier/accurate version of tiny face detector
    // faceapi.nets.faceRecognitionNet.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights'),
    // faceapi.nets.faceLandmark68Net.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights'),
    // faceapi.nets.faceLandmark68TinyNet.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights'),
    // faceapi.nets.ssdMobilenetv1.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights'),
    // faceapi.nets.tinyFaceDetector.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights'),
    // faceapi.nets.mtcnn.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights'),

]).then(start)

function start() {
    document.body.append('Models Loaded')
    
    // navigator.getUserMedia(
    //     { video:{} },
    //     stream => video.srcObject = stream,
    //     err => console.error(err)
    // )
    // var constraints = { audio: true, video: true }; 

    navigator.mediaDevices.getUserMedia(constraints)
    .then(function(mediaStream) {
      var video = document.querySelector('video');
      video.srcObject = mediaStream;
      video.onloadedmetadata = function(e) {
        video.play();
      };
    })
    .catch(function(err) { console.log(err.name + ": " + err.message); });
    
    
    //video.src = '../videos/speech.mp4'
    console.log('video added')
    recognizeFaces()
}

async function recognizeFaces() {

    const labeledDescriptors = await loadLabeledImages()
    console.log(labeledDescriptors)
    const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.7)


    video.addEventListener('play', async () => {
        console.log('Playing')
        const canvas = faceapi.createCanvasFromMedia(video)
        document.body.append(canvas)

        const displaySize = { width: video.width, height: video.height }
        faceapi.matchDimensions(canvas, displaySize)

        

        setInterval(async () => {
            const detections = await faceapi.detectAllFaces(video).withFaceLandmarks().withFaceDescriptors()

            const resizedDetections = faceapi.resizeResults(detections, displaySize)

            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)

            const results = resizedDetections.map((d) => {
                return faceMatcher.findBestMatch(d.descriptor)
            })
            console.log(results)
            results.forEach( (result, i) => {
                const box = resizedDetections[i].detection.box
                const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() })
                drawBox.draw(canvas)
            })
        }, 100)


        
    })
}


function loadLabeledImages() {
    //const labels = ['Black Widow', 'Captain America', 'Hawkeye' , 'Jim Rhodes', 'Tony Stark', 'Thor', 'Captain Marvel']
    const labels = ['Chen Yun Hong','Gao Fong','Wei Cheng'] // for WebCam
    return Promise.all(
        labels.map(async (label)=>{
            const descriptions = []
            for(let i=1; i<=3; i++) {
                if (UrlExists(`../public/labeled_images/${label}/${i}.jpg`) == false) break;
                const img = await faceapi.fetchImage(`../public/labeled_images/${label}/${i}.jpg`)
                const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()
                console.log(label + i + JSON.stringify(detections))
                descriptions.push(detections.descriptor)
            }
            document.body.append(label+' Faces Loaded | ')
            return new faceapi.LabeledFaceDescriptors(label, descriptions)
        })
    )
}

function UrlExists(url)
{
    var http = new XMLHttpRequest();
    http.open('HEAD', url, false);
    http.send();
    return http.status!=404;
}