export async function recordTab(streamId: string, onStop = () => void 0): Promise<MediaRecorder> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      mandatory: {
        chromeMediaSource: 'desktop',
        chromeMediaSourceId: streamId,
      },
    } as MediaTrackConstraints,
    video: {
      mandatory: {
        chromeMediaSource: 'desktop',
        chromeMediaSourceId: streamId,
      },
    } as MediaTrackConstraints,
  });


  const audioCtx = new AudioContext();
  const destination = audioCtx.createMediaStreamDestination();

  try {
    const sysSource = audioCtx.createMediaStreamSource(stream);
    sysSource.connect(destination);
  } catch (err) {
    console.error(err);
  }

  let micStream;

  try {
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const micSource = audioCtx.createMediaStreamSource(micStream);
    micSource.connect(destination);
  } catch (err) {
    console.log(err);
  }

  const output = new MediaStream();
  output.addTrack(destination.stream.getAudioTracks()[0]);
  output.addTrack(stream.getVideoTracks()[0]);

  const recorder = new MediaRecorder(output, {
    mimeType: 'video/webm;codecs=vp8,vp9,opus',
  });

  stream.getVideoTracks()[0].onended = () => {
    stream.getTracks().forEach((track) => track.stop());
    if (micStream) {
      micStream.getTracks().forEach((track) => track.stop());
    }
    recorder.stop();
    onStop();
  };

  return recorder;
}
