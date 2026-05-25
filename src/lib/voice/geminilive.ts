export type ResponseModality = 'AUDIO' | 'TEXT';

export type VoiceName = 'Puck' | 'Kore' | 'Charon' | 'Fenrir' | 'Aoede';

export type ActivityDetectionConfig = {
  disabled: boolean;
  silenceDurationMs: number;
  prefixPaddingMs: number;
  endOfSpeechSensitivity: string;
  startOfSpeechSensitivity: string;
};

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
  private setupComplete = false;
  private toolDeclarations: ToolDeclaration[] = [];

  voiceName: VoiceName = 'Kore';
  temperature = 1.0;
  responseModalities: ResponseModality[] = ['AUDIO'];
  isThinkingMode = false;
  thinkingBudget = 1024;
  inputAudioTranscription = false;
  outputAudioTranscription = false;

  automaticActivityDetection: ActivityDetectionConfig = {
    disabled: false,
    silenceDurationMs: 1500,
    prefixPaddingMs: 400,
    endOfSpeechSensitivity: 'END_SENSITIVITY_HIGH',
    startOfSpeechSensitivity: 'START_SENSITIVITY_HIGH',
  };

  activityHandling = 'ACTIVITY_HANDLING_UNSPECIFIED';

  constructor(handlers: MessageHandler) {
    this.handlers = handlers;
  }

  setPublicMode(enabled: boolean) {
    if (enabled) {
      this.automaticActivityDetection = {
        ...this.automaticActivityDetection,
        silenceDurationMs: 2500,
        endOfSpeechSensitivity: 'END_SENSITIVITY_LOW',
        startOfSpeechSensitivity: 'START_SENSITIVITY_LOW',
      };
    } else {
      this.automaticActivityDetection = {
        ...this.automaticActivityDetection,
        silenceDurationMs: 1500,
        endOfSpeechSensitivity: 'END_SENSITIVITY_HIGH',
        startOfSpeechSensitivity: 'START_SENSITIVITY_HIGH',
      };
    }
    this.sendSessionUpdate({
      realtimeInputConfig: {
        automaticActivityDetection: this.getVADConfig(),
        activityHandling: this.activityHandling,
      },
    });
  }

  setVoice(voiceName: VoiceName) {
    this.voiceName = voiceName;
    this.sendSessionUpdate({
      generationConfig: {
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName } },
        },
      },
    });
  }

  setThinkingMode(enabled: boolean, budget = 1024) {
    this.isThinkingMode = enabled;
    this.thinkingBudget = budget;
    this.sendSessionUpdate({
      generationConfig: {
        thinkingConfig: { thinkingBudget: enabled ? budget : 0 },
      },
    });
  }

  setTools(tools: ToolDeclaration[]) {
    this.toolDeclarations = tools;
  }

  private getVADConfig() {
    return {
      disabled: this.automaticActivityDetection.disabled,
      silenceDurationMs: this.automaticActivityDetection.silenceDurationMs,
      prefixPaddingMs: this.automaticActivityDetection.prefixPaddingMs,
      endOfSpeechSensitivity: this.automaticActivityDetection.endOfSpeechSensitivity,
      startOfSpeechSensitivity: this.automaticActivityDetection.startOfSpeechSensitivity,
    };
  }

  private sendSessionUpdate(config: Record<string, unknown>) {
    if (this.connected && this.setupComplete && this.ws) {
      this.ws.send(JSON.stringify({ session_update: config }));
    }
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
      this.handlers.onOpen?.();
    };

    this.ws.onmessage = (event) => {
      if (typeof event.data === 'string') {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (e) {
          console.warn('[GeminiLive] Falha ao parsear mensagem de texto:', e, event.data.substring(0, 120));
        }
      }
      /* binary (audio) frames ignored — handled via modelTurn audio parts */
    };

    this.ws.onclose = (event: CloseEvent) => {
      console.warn(`WebSocket fechado: code=${event.code}, reason=${event.reason}, wasClean=${event.wasClean}`);
      this.connected = false;
      this.setupComplete = false;
      this.handlers.onClose?.();
    };

    this.ws.onerror = (error) => {
      this.connected = false;
      this.setupComplete = false;
      this.handlers.onError?.(error);
    };
  }

  disconnect() {
    this.connected = false;
    this.setupComplete = false;
    this.ws?.close();
    this.ws = null;
  }

  sendAudioMessage(base64Audio: string) {
    if (!this.connected || !this.setupComplete || !this.ws) return;
    this.ws.send(
      JSON.stringify({
        realtimeInput: {
          audio: {
            data: base64Audio,
            mimeType: 'audio/pcm;rate=16000',
          },
        },
      })
    );
  }

  sendTextMessage(text: string) {
    if (!this.connected || !this.setupComplete || !this.ws) return;
    this.ws.send(
      JSON.stringify({
        realtimeInput: { text },
      })
    );
  }

  sendToolResponse(id: string, name: string, response: unknown) {
    if (!this.connected || !this.setupComplete || !this.ws) return;
    this.ws.send(
      JSON.stringify({
        toolResponse: {
          functionResponses: [
            {
              id,
              name,
              response: { result: response },
            },
          ],
        },
      })
    );
  }

  get isConnected() {
    return this.connected;
  }

  private sendSetup(systemInstruction?: string) {
    if (!this.ws) return;

    const setup: Record<string, unknown> = {
      model: 'models/gemini-3.1-flash-live-preview',
      generationConfig: {
        responseModalities: this.responseModalities,
        temperature: this.temperature,
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: this.voiceName } },
        },
      },
    };

    setup.tools = [{ functionDeclarations: this.toolDeclarations }];

    if (systemInstruction) {
      setup.systemInstruction = {
        parts: [{ text: systemInstruction }],
      };
    }

    if (this.isThinkingMode) {
      (setup.generationConfig as Record<string, unknown>).thinkingConfig = {
        thinkingBudget: this.thinkingBudget,
      };
    }

    setup.realtimeInputConfig = {
      automaticActivityDetection: this.getVADConfig(),
      activityHandling: this.activityHandling,
      turnCoverage: 'TURN_INCLUDES_ONLY_ACTIVITY',
    };

    if (this.inputAudioTranscription) {
      (setup as any).inputAudioTranscription = {};
    }
    if (this.outputAudioTranscription) {
      (setup as any).outputAudioTranscription = {};
    }

    this.ws.send(JSON.stringify({ setup }));
  }

  private handleMessage(data: any) {
    try {
      if ('setupComplete' in data) {
        this.setupComplete = true;
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
      }

      if (data.toolCall) {
        const calls: ToolCall[] = (data.toolCall.functionCalls || []).map(
          (fc: any) => ({
            id: fc.id,
            name: fc.name,
            args: fc.args || {},
          })
        );
        this.handlers.onToolCall?.(calls);
      }
    } catch (e) {
      console.error('[GeminiLive] Erro em handleMessage:', e);
    }
  }
}
