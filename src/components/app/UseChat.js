/**
 * Implements the dialog management between user, student and professor agents.
 * This version is corrected to properly manage the ChatBot instance within the React lifecycle.
 */
import { useState, useRef, useEffect } from "react";
import ChatBot, { STUDENT_OPENING_SENTENCE, USER_OPENING_SENTENCE } from "../llm-core/chat_bot_bio.js";
import { WritingAnimationStudent, WritingAnimationProfessor } from '../misc/writingAnimation.js';
import Typewriter from '../misc/Typewriter';

const supervisorString = `Please help the student learn the material.`;

function splitString(string) {
  const splits = string.split("teacher): ");
  if (splits.length > 1) {
    return splits[1];
  } else {
    const splits = string.split("teacher: ");
    if (splits.length > 1) {
      return splits[1];
    } else {
      return string;
    }
  }
};

async function studentWorkflow(chatLog, setChat, chatBotInstance) {
  setChat((prevChat) => [
    ...prevChat,
    { text: <WritingAnimationStudent />, type: "student", waiting: true },
  ]);
  const student_responses = await chatBotInstance.callStudentLLM();
  for (let i = 0; i < student_responses.length; i++) {
    const student_response = student_responses[i];
    let t3 = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
    chatLog.current.main.push({text: student_response, type: "student", date: t3});
    setChat((prevChat) => [
      ...prevChat.slice(0, -1),
        { text: splitString(student_response), type: "student", waiting: false }
    ]);
    await new Promise((resolve) => setTimeout(resolve, 2200));
    if (i < student_responses.length - 1) {
      setChat((prevChat) => [
        ...prevChat,
        { text: <WritingAnimationStudent />, type: "student", waiting: true },
      ]);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
};

const useChat = ({ scrollToBottom }) => {
  const chatBot = useRef(null); 
  
  const [message, setMessage] = useState("");
  const [removeMarker, setMarker] = useState(false);
  const [sendActive, setSend] = useState(false);
  const [chat, setChat] = useState([{ text: splitString(STUDENT_OPENING_SENTENCE), type: "student", waiting: false }]);
  const [TASText, setTASText] = useState(supervisorString);
  
  let time = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
  const chatLog = useRef({
    main: [{text: USER_OPENING_SENTENCE, isUser: true, date: time}],
    help: [],
    supervisor: [{text: supervisorString, date: time}],
    paste: [],
  });

  useEffect(() => {
    const initChat = async () => {
      try {
        if (!chatBot.current) {
            chatBot.current = new ChatBot();
        }
        await new Promise((resolve) => setTimeout(resolve, 3000));
        setChat((prevChat) => [
          ...prevChat,
          { text: <WritingAnimationStudent />, type: "student", waiting: true },
        ]);
        
        const response = await chatBot.current.callStudentLLM(); 
        
        let time = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
        chatLog.current.main.push({text: response, type: "student", date: time});
        setChat((prevChat) => [
          ...prevChat.slice(0, -1),
          { text: splitString(response[0]), type: "student", waiting: false }
        ]);
        await new Promise((resolve) => setTimeout(resolve, 800));
        setSend(true);
      }
      catch (error) {
        console.error('Error in initChat:', error);
        // Provide user feedback in the UI if something goes wrong
        setChat((prevChat) => [
            ...prevChat.slice(0, -1),
            { text: "Sorry, I'm having trouble connecting. Please try refreshing.", type: "student", waiting: false }
        ]);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setSend(true);
      }
    };
    
    if (!chatBot.current) {
        initChat();
    }
  }, []);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (sendActive && (message.trim() !== "")) {
      setSend(false);
      if (removeMarker) {
        setChat((prevChat) => [
          ...prevChat.slice(0, -2),
          { text: message, type: "user", misconception: false },
        ]);
        setMarker(false);
      } else {
        setChat((prevChat) => [ 
          ...prevChat,
          { text: message, type: "user", misconception: false },
        ]);
      }
      await new Promise((resolve) => setTimeout(resolve, 200));
      setMessage("");
      let t1 = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
      chatLog.current.main.push({text: "Teacher (to the student): " + message, isUser: true, date: t1});
      const msg = { role: "user", content: "Teacher (to the student): " + message };
      
      chatBot.current.addToMsgList(msg); 

      // --- CONSOLIDATED LOGIC ---
      // REMOVED the immediate call to check for misconceptions.
      // The student workflow is now the only path forward, simplifying the logic
      // and preventing the burst of API calls. The misconception logic could be
      // integrated into the student's system prompt for a more advanced solution.

      setTASText(supervisorString);
      await studentWorkflow(chatLog, setChat, chatBot.current);
      setMarker(false);
      
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSend(true);
    }
  };

  const requestHelp = async (e) => {
    e.preventDefault();
    setTASText(<WritingAnimationProfessor />);
    const teacher_response = await chatBot.current.callTASHelp();
    let time = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
    chatLog.current.help.push({text: teacher_response, date: time});
    setTASText(<Typewriter text={splitString(teacher_response)} scroll={scrollToBottom} className="professor-message" />);
  }

  return { chat, TASText, requestHelp, message, setMessage, sendMessage, chatLog };
};

export default useChat;