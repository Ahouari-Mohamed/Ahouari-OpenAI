import './HomePage.css';
import { Link } from 'react-router-dom';
import { TypeAnimation } from "react-type-animation";
import { useState } from "react";

export default function HomePage(){
    const [typingStatus, setTypingStatus] = useState("human1");
    return(
        <div className='Homepage'>
            <img src="/pictures/orbital.png" alt="bg-img" className='orbital'/>
            <div className='left'>
                <h1>Ahouari AI</h1>
                <h2>Unlock Your Creative Potential</h2>
                <p>
                    Step into a world where your ideas come to life. 
                    Ahouari AI empowers you to push the boundaries of creativity and productivity.
                    Let your imagination soar and accomplish more than you ever thought possible.
                </p>
                <Link to="/Dashboard" className='Link'>Get Started</Link>
            </div>

            <div className='right'>
                <div className="img-container">
                    <div className="bg-container">
                        <div className="bg"></div>
                    </div>  
                    <img src="/pictures/bot.png" alt="bot-img" className='bot-img'/>
                    <div className="chat">
                        <img
                            src={
                                typingStatus === "human1"
                                ? "/pictures/human1.jpeg"
                                : typingStatus === "human2"
                                ? "/pictures/human2.jpeg"
                                : "/pictures/bot.png"
                            }
                            alt=""
                        />
                        <TypeAnimation
                            sequence={[
                                "Human:AI is getting smarter every day.",
                                2000,
                                () => {
                                setTypingStatus("bot");
                                },
                                "Bot:I'm here to help you with whatever you need.",
                                2000,
                                () => {
                                setTypingStatus("human2");
                                },
                                "Human2:Do you think AI will ever surpass human intelligence?",
                                2000,
                                () => {
                                setTypingStatus("bot");
                                },
                                "Bot:AI complements human intelligence, but I still rely on human input.",
                                2000,
                                () => {
                                setTypingStatus("human1");
                                },
                            ]}
                            wrapper="span"
                            repeat={Infinity}
                            cursor={true}
                            omitDeletionAnimation={true}
                        />
                    </div>
                </div>
            </div>
            <div className="terms">
                <div className="links">
                <Link to="/">Terms of Service</Link>
                <span>|</span>
                <Link to="/">Privacy Policy</Link>
                </div>
            </div>
        </div>
    );
}