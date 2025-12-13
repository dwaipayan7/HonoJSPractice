import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ChatMessage {
    user: string;
    message: string;
    time: number;
}

const WEBSOCKET_URL = 'ws://10.0.2.2:3000/ws';

export default function ChatApp() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [username, setUsername] = useState('');
    const [isUsernameSet, setIsUsernameSet] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const ws = useRef<WebSocket | null>(null);
    const flatListRef = useRef<FlatList>(null);


    useEffect(() => {

        if (isUsernameSet) {
            connectWebSocket();
        }

        return () => {
            if (ws.current) {
                ws.current.close();
            }
        }

    }, [isUsernameSet]);

    const connectWebSocket = () => {
        try {

            ws.current = new WebSocket(WEBSOCKET_URL);

            ws.current.onopen = () => {
                console.log("Connected to WebSocket");
                setIsConnected(true);

            }

            ws.current.onmessage = (event) => {
                const data: ChatMessage = JSON.parse(event.data);
                setMessages((prev) => [...prev, data]);
            }

            ws.current.onerror = (error) => {
                console.log("Web Socket Error: ", error);
                setIsConnected(false);

            }
            ws.current.onclose = () => {
                setIsConnected(false)
                setTimeout(connectWebSocket, 2000)
            }



        } catch (error) {
            console.error('Connection error:', error);
        }
    }

    const sendMessage = () => {
        if (inputText.trim() && ws.current?.readyState === WebSocket.OPEN) {
            const message: ChatMessage = {
                user: username,
                message: inputText.trim(),
                time: Date.now()
            };

            ws.current.send(JSON.stringify(message));
            setInputText('')

        }
    };

    const handleUsernameSubmit = () => {
        if (username.trim()) {
            setIsUsernameSet(true);
        }
    }

    const formatTime = (timeStamp: number) => {
        const data = new Date(timeStamp);
        return data.toLocaleDateString('in-en', {
            hour: '2-digit',
            minute: '2-digit'
        })
    };

    if (!isUsernameSet) {
        return (
            <SafeAreaView style={styles.usernameContainer}>
                <Text style={styles.title}>Enter your username</Text>

                <TextInput
                    style={styles.usernameInput}
                    placeholder="Your name"
                    value={username}
                    onChangeText={setUsername}
                />

                <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleUsernameSubmit}
                >
                    <Text style={styles.submitButtonText}>Join Chat</Text>
                </TouchableOpacity>
            </SafeAreaView>
        )
    }



    const renderMessage = ({ item }: { item: ChatMessage }) => {
        const isOwnMessage = item.user === username;
        return (
            <View style={[styles.messageContainer, isOwnMessage ? styles.ownMessage : styles.otherMessage]}>
                {!isOwnMessage && <Text style={styles.username}>{item?.user}</Text>}
                <Text style={styles.messageText}>{item?.message}</Text>
                <Text style={styles.timeText}>{formatTime(item.time)}</Text>
            </View>
        );
    };


    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >

                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Chat Room Here</Text>
                    <View style={styles.statusContainer}>
                        <View style={[styles.statusDot, { backgroundColor: isConnected ? '#4caf50' : 'red', }]}>


                        </View>
                        <Text style={styles.statusText}>
                            {isConnected ? 'Connected' : 'DisConnected'}
                        </Text>
                    </View>
                </View>

                {!isConnected && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size={'large'} color={'blue'} />
                        <Text style={styles.loadingText}>Connecting...</Text>
                    </View>
                )}

                <FlatList

                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={(_, index) => index.toString()}
                    contentContainerStyle={styles.messagesList}
                    onContentSizeChange={() => {
                        flatListRef.current?.scrollToEnd({ animated: true })
                    }}
                />

                <View style={styles.inputContainer}>
                    <TextInput

                        style={styles.input}
                        placeholder='Type message'
                        value={inputText}
                        onChangeText={setInputText}
                        onSubmitEditing={sendMessage}
                        multiline
                        maxLength={500}
                    />

                    <TouchableOpacity style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                        onPress={sendMessage} disabled={!inputText.trim()}
                    >
                        <Text>Send</Text>
                    </TouchableOpacity>

                </View>

            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    header: {
        backgroundColor: '#007AFF',
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    statusText: {
        color: '#FFFFFF',
        fontSize: 12,
    },
    loadingContainer: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: -50 }, { translateY: -50 }],
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: '#666',
    },
    usernameContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
    },
    usernameInput: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#FFF',
        marginBottom: 16,
    },
    submitButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 8,
        width: '100%',
        alignItems: 'center',
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    messagesList: {
        padding: 16,
    },
    messageContainer: {
        maxWidth: '75%',
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
    },
    ownMessage: {
        alignSelf: 'flex-end',
        backgroundColor: '#007AFF',
        // color: 'white'
    },
    otherMessage: {
        alignSelf: 'flex-start',
        backgroundColor: '#FFFFFF',
    },
    username: {
        fontSize: 12,
        fontWeight: '600',
        color: 'blue',
        marginBottom: 4,
    },
    messageText: {
        fontSize: 16,
        color: '#333',
    },
    timeText: {
        fontSize: 11,
        color: '#999',
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 12,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        fontSize: 16,
        maxHeight: 100,
        backgroundColor: '#F8F8F8',
    },
    sendButton: {
        backgroundColor: '#007AFF',
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 10,
        marginLeft: 8,
        justifyContent: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: '#CCC',
    },
    sendButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});