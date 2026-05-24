type MessageHandler = {
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  onAudio?: (base64: string) => void;
  onText?: (text: string) => void;
  onInterrupt?: () => void;
  onTurnComplete?: () => void;
  onToolCall?: (calls: ToolCall[]) => void;
  onSetupComplete?: () => void;
};

type ToolCall = {
  id: string;
  name: string;
  args: Record<string, unknown>;
};

type ToolDeclaration = {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
};

export class GeminiLiveAPI {
  private ws: WebSocket | null = null;
  private token: string | null = null;
  private handlers: MessageHandler;
  private connected = false;
  private toolDeclarations: ToolDeclaration[] = [];

  constructor(handlers: MessageHandler) {
    this.handlers = handlers;
  }

  setTools(tools: ToolDeclaration[]) {
    this.toolDeclarations = tools;
  }

  async connect(systemInstruction?: string) {
    const res = await fetch('/api/token', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to get token');
    const { token } = await res.json();
    this.token = token;

    const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained?access_token=${token}`;

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.connected = true;
      this.sendSetup(systemInstruction);
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch { /* ignore binary */ }
    };

    this.ws.onclose = () => {
      this.connected = false;
      this.handlers.onClose?.();
    };

    this.ws.onerror = (error) => {
      this.connected = false;
      this.handlers.onError?.(error);
    };
  }

  disconnect() {
    this.connected = false;
    this.ws?.close();
    this.ws = null;
  }

  sendAudioMessage(base64Audio: string) {
    if (!this.connected || !this.ws) return;
    this.ws.send(JSON.stringify({
      realtimeInput: {
        mediaChunks: [{
          data: base64Audio,
          mimeType: 'audio/pcm;rate=16000',
        }],
      },
    }));
  }

  sendTextMessage(text: string) {
    if (!this.connected || !this.ws) return;
    this.ws.send(JSON.stringify({
      realtimeInput: {
        mediaChunks: [{
          data: btoa(text),
          mimeType: 'text/plain',
        }],
      },
    }));
  }

  sendToolResponse(id: string, name: string, response: unknown) {
    if (!this.connected || !this.ws) return;
    this.ws.send(JSON.stringify({
      toolResponse: {
        functionResponses: [{
          id,
          name,
          response: { result: response },
        }],
      },
    }));
  }

  get isConnected() { return this.connected; }

  private sendSetup(systemInstruction?: string) {
    if (!this.ws) return;

    const tools = this.toolDeclarations.length > 0 ? [{
      functionDeclarations: this.toolDeclarations,
    }] : [];

    const setup: Record<string, unknown> = {
      model: 'models/gemini-3.1-flash-live-preview',
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
        },
      },
      tools,
    };

    if (systemInstruction) {
      setup.systemInstruction = {
        parts: [{ text: systemInstruction }],
      };
    }

    this.ws.send(JSON.stringify({ setup }));
  }

  private handleMessage(data: any) {
    if (data.setupComplete) {
      this.handlers.onSetupComplete?.();
      return;
    }

    if (data.serverContent) {
      const content = data.serverContent;

      if (content.interrupted) {
        this.handlers.onInterrupt?.();
        return;
      }

      if (content.turnComplete) {
        this.handlers.onTurnComplete?.();
        return;
      }

      if (content.modelTurn) {
        for (const part of content.modelTurn.parts || []) {
          if (part.inlineData?.mimeType?.startsWith('audio/')) {
            this.handlers.onAudio?.(part.inlineData.data);
          }
          if (part.text) {
            this.handlers.onText?.(part.text);
          }
        }
      }

      if (content.inputTranscription) {
        // transcription available in content.inputTranscription.text
      }
    }

    if (data.toolCall) {
      const calls: ToolCall[] = (data.toolCall.functionCalls || []).map((fc: any) => ({
        id: fc.id,
        name: fc.name,
        args: fc.args || {},
      }));
      this.handlers.onToolCall?.(calls);
    }
  }
}
