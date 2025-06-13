import React, { createContext, useContext, useState } from 'react';

const ChatContext = createContext();

const initialMatches = [
  {
    id: '1',
    name: 'Emily',
    age: 25,
    image: require('../assets/user1.jpg'),
    messages: [
      { id: 'm1', text: 'Hey! Want to play a game?', sender: 'them' },
      { id: 'm2', text: 'Sure! Tic Tac Toe?', sender: 'you' },
      { id: 'm3', text: 'Sounds good!', sender: 'them' },
    ],
    matchedAt: '2 days ago',
  },
  {
    id: '2',
    name: 'Liam',
    age: 27,
    image: require('../assets/user2.jpg'),
    messages: [
      { id: 'm1', text: 'Ready for a rematch?', sender: 'them' },
    ],
    matchedAt: '1 day ago',
  },
  {
    id: '3',
    name: 'Ava',
    age: 23,
    image: require('../assets/user1.jpg'),
    messages: [
      { id: 'm1', text: 'BRB grabbing coffee ☕', sender: 'them' },
    ],
    matchedAt: '5 hours ago',
  },
];

export const ChatProvider = ({ children }) => {
  const [matches, setMatches] = useState(initialMatches);

  const sendMessage = (matchId, text) => {
    setMatches((prev) =>
      prev.map((m) =>
        m.id === matchId
          ? {
              ...m,
              messages: [
                ...m.messages,
                { id: Date.now().toString(), text, sender: 'you' },
              ],
            }
          : m
      )
    );
  };

  const removeMatch = (matchId) =>
    setMatches((prev) => prev.filter((m) => m.id !== matchId));

  const getMessages = (matchId) =>
    matches.find((m) => m.id === matchId)?.messages || [];

  return (
    <ChatContext.Provider value={{ matches, sendMessage, getMessages, removeMatch }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChats = () => useContext(ChatContext);
