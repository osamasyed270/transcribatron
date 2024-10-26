import { useState, useEffect, useRef } from 'react';
import videoInfo from "./videoTranscriptInfo.json";
import { Bold, Italic, Underline, ArrowLeftFromLine , ArrowRightFromLine } from 'lucide-react'
import "./videoMainBodyStyle.css";
import {  AiOutlineBold, AiOutlineItalic, AiOutlineUnderline, AiOutlineFontColors} from "react-icons/ai";

function VideoMainBody() {
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [transcriptPhrases, setTranscriptPhrases] = useState([]);
  const [selectedRange, setSelectedRange] = useState({ startIndex: -1, endIndex: -1, phraseIndex: -1 });
  const [highlightedWord, setHighlightedWord] = useState({ phraseIndex: -1, wordIndex: -1 });

  useEffect(() => {
    setTranscriptPhrases(videoInfo.videoLesson.transcription[0].phrases);
  }, []);

  let player = useRef(null);

  useEffect(() => {
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      player.current = new window.YT.Player('video-player', {
        videoId: videoInfo.videoLesson.videoId,
        events: {
          onReady: onPlayerReady,
        }
      });
    };
  }, []);

  const onPlayerReady = (event) => {
    setInterval(() => {
      setVideoCurrentTime(event.target.getCurrentTime());
    }, 100);
  };

  const handleWordSelect = (phraseIndex, wordIndex, type) => {
    setSelectedRange(prevRange => {
      if (type === 'start') {
        return { ...prevRange, startIndex: wordIndex, phraseIndex };
      } else if (type === 'end') {
        return { ...prevRange, endIndex: wordIndex, phraseIndex };
      }
      return prevRange;
    });

    setHighlightedWord({ phraseIndex, wordIndex });
  };

  const applyStyle = (styleType, value) => {
    const { phraseIndex, wordIndex } = highlightedWord;
    if (phraseIndex === -1 || wordIndex === -1) return

    setTranscriptPhrases(prevPhrases => {
      const updatedPhrases = [...prevPhrases];
      const wordMeta = { ...updatedPhrases[phraseIndex].words[wordIndex].meta };
    
      if (wordMeta[styleType] === value) {
        delete wordMeta[styleType];
      } else {
        wordMeta[styleType] = value;
      }

      updatedPhrases[phraseIndex].words[wordIndex].meta = wordMeta;

      return updatedPhrases;
    })
  }

  const handleSplit = (direction) => {
    const { startIndex, endIndex, phraseIndex } = selectedRange;

    const updatedPhrases = transcriptPhrases.map((phrase, index) => {
      if (index === phraseIndex) {
        const words = phrase.words;

        let before, after;

        if (direction === 'forward') {
          before = words.slice(0, endIndex + 1);  
          after = words.slice(endIndex + 1);      
        } else if (direction === 'backward') {
          before = words.slice(0, startIndex);
          after = words.slice(startIndex);
        }

        const newSentence1 = { ...phrase, words: before }; 
        const newSentence2 = { ...phrase, words: after };  

        return [newSentence1, newSentence2]; 
      }

      return [phrase];
    });

    console.log(updatedPhrases);
    

    const flattenedPhrases = updatedPhrases.flat();

    setTranscriptPhrases(flattenedPhrases);
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Enter') {
        handleSplit('forward'); 
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedRange]);

  return (
    <div className='video-main-body'>
      <div className="video-main-body-inner">
        <div className="video-editing-bar">
          <button className="edit-btn bold-btn" onClick={() => applyStyle('fontWeight', 'bold')}><AiOutlineBold /></button>
          <button className="edit-btn italic-btn" onClick={() => applyStyle('fontStyle', 'italic')}><AiOutlineItalic /></button>
          <button className="edit-btn underline-btn" onClick={() => applyStyle('textDecoration', 'underline')}><AiOutlineUnderline /></button>
          <button className="edit-btn color-visible-btn" id='color-visible-btn' onClick={() => document.getElementById("color-btn").click()}><AiOutlineFontColors />
            <input type='color' className="color-btn" id='color-btn' onChange={(e) => {applyStyle('textColor', e.target.value); document.getElementById("color-visible-btn").style.color = e.target.value}}></input>
          </button>

          
          <button className='edit-btn split-btn' onClick={() => handleSplit('backward')}><ArrowLeftFromLine />Split</button>
          <button className='edit-btn split-btn' onClick={() => handleSplit('forward')}>Split<ArrowRightFromLine /></button>
        </div>
        <div className='player-container'>
          <div id="video-player"></div>
        </div>
        <div className='video-transcript-container'>
          <div className="video-transcript-inner">
            {transcriptPhrases.map((phrase, phraseIndex) => {
              return (
                <div className='sentence' key={phraseIndex}>
                  {phrase.words.map((item, itemIndex) => {
                    const { fontWeight, fontStyle, textDecoration, textColor } = item.meta || {};

                    return (
                      <span 
                        key={itemIndex}
                        onMouseDown={() => handleWordSelect(phraseIndex, itemIndex, 'start')}
                        onMouseUp={() => handleWordSelect(phraseIndex, itemIndex, 'end')}
                      >
                        <div>
                          <span 
                          className=
                          {`word 
                            ${item.startTime && item.endTime && videoCurrentTime >= item.startTime && videoCurrentTime <= item.endTime ? "active" : ""} 
                            ${highlightedWord.phraseIndex === phraseIndex && highlightedWord.wordIndex === itemIndex ? 'highlight' : ''}
                          `}
                          style={{
                            fontWeight: fontWeight || 'normal',
                            fontStyle: fontStyle || 'normal',
                            textDecoration: textDecoration || 'none',
                            color: textColor || 'black',
                          }}
                          >{item.word}</span>

                          {item.tags?.speaker?.length > 0 ?
                            <span className="word-tag">
                              <span className='tag-info'><span>{item.tags.speaker[0].tag}</span> <span>:</span> <span>{item.tags.speaker[0].value}</span></span>
                              <span className='tag-icon'>🔊</span>
                            </span> : ""
                          }
                        </div>

                        <div> </div>
                      </span>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
        
      </div>
    </div>
  );
}

export default VideoMainBody;
