// Teste de conexão WebSocket com Gemini Live API
// Uso: node test-websocket.mjs

const API_URL = 'http://localhost:9002/api/token';
const TIMEOUT_MS = 30_000;

function arrayBufferToString(buf) {
  return new TextDecoder().decode(new Uint8Array(buf));
}

async function main() {
  console.log('=== TESTE GEMINI LIVE API WEBSOCKET ===\n');

  // 1. Fetch token
  console.log('1. Solicitando token...');
  const res = await fetch(API_URL, { method: 'POST' });
  if (!res.ok) {
    console.error(`   ERRO: Token endpoint retornou ${res.status}`);
    process.exit(1);
  }
  const { token } = await res.json();
  console.log(`   Token obtido: ${token.substring(0, 50)}...`);
  console.log(`   Tamanho: ${token.length} chars\n`);

  // 2. Connect WebSocket
  const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained?access_token=${token}`;
  console.log('2. Conectando WebSocket...');
  
  const ws = new WebSocket(wsUrl);
  ws.binaryType = 'arraybuffer';

  const connectionPromise = new Promise((resolve, reject) => {
    ws.onopen = () => {
      console.log('   ✅ WebSocket CONECTADO (onOpen disparado imediatamente)\n');
      resolve();
    };
    ws.onerror = (err) => {
      console.error('   ❌ WebSocket error:', err.message || err);
      reject(err);
    };
  });

  const timeout = setTimeout(() => {
    console.error('   ❌ TIMEOUT: WebSocket não conectou em 15s');
    ws.close();
    process.exit(1);
  }, 15_000);

  await connectionPromise;
  clearTimeout(timeout);

  // 3. Send setup
  console.log('3. Enviando setup message...');
  
  const setupMsg = {
    setup: {
      model: 'models/gemini-3.1-flash-live-preview',
      generationConfig: {
        responseModalities: ['AUDIO'],
        temperature: 1.0,
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
        },
      },
      tools: [{
        functionDeclarations: [
          { 
            name: 'getWikiArticle', 
            description: 'Get article content', 
            parameters: { type: 'object', properties: { slug: { type: 'string' } }, required: ['slug'] } 
          },
          { 
            name: 'help', 
            description: 'Show help', 
            parameters: { type: 'object', properties: {} } 
          },
        ],
      }],
      realtimeInputConfig: {
        automaticActivityDetection: {
          disabled: false,
          silenceDurationMs: 1500,
          prefixPaddingMs: 400,
          endOfSpeechSensitivity: 'END_SENSITIVITY_HIGH',
          startOfSpeechSensitivity: 'START_SENSITIVITY_HIGH',
        },
        activityHandling: 'ACTIVITY_HANDLING_UNSPECIFIED',
        turnCoverage: 'TURN_INCLUDES_ONLY_ACTIVITY',
      },
    },
  };

  ws.send(JSON.stringify(setupMsg));
  console.log('   Setup message enviada\n');

  // 4. Wait for messages
  console.log('4. Aguardando mensagens (30s timeout)...\n');

  let setupDone = false;
  let audioChunks = 0;
  let textChunks = 0;
  let toolCalls = 0;
  let binaryCount = 0;
  let otherMessages = 0;
  let gotFirstAudio = false;

  const result = await new Promise((resolve) => {
    const timer = setTimeout(() => {
      ws.close();
      resolve({ reason: 'timeout 30s', setupDone, audioChunks, textChunks, toolCalls, otherMessages, binaryCount });
    }, TIMEOUT_MS);

    ws.onmessage = (event) => {
      // Handle binary vs text
      if (event.data instanceof ArrayBuffer) {
        binaryCount++;
        const str = arrayBufferToString(event.data);
        
        // Try to parse as JSON
        if (str.startsWith('{') || str.startsWith('[')) {
          try {
            const data = JSON.parse(str);
            processMessage(data);
            return;
          } catch {}
        }
        
        // Audio data or unknown binary
        if (str.includes('audio') || str.includes('inlineData')) {
          // This shouldn't happen - audio should be in JSON wrapper
          if (binaryCount <= 3) {
            console.log(`   📦 Binary #${binaryCount}: unintelligible binary (${event.data.byteLength} bytes)`);
          }
        } else {
          if (binaryCount <= 3) {
            console.log(`   📦 Binary #${binaryCount}: ${event.data.byteLength} bytes - "${str.substring(0, 80)}"`);
          }
        }
        return;
      }
      
      // Text message
      if (typeof event.data === 'string') {
        try {
          const data = JSON.parse(event.data);
          processMessage(data);
        } catch (e) {
          console.log(`   ❌ JSON parse error: "${event.data.substring(0, 100)}"`);
        }
        return;
      }
      
      console.log(`   ❓ Unknown data type: ${typeof event.data}`);
    };

    function processMessage(data) {
      if ('setupComplete' in data) {
        setupDone = true;
        console.log('   ✅ setupComplete RECEBIDO!');
        console.log('   🎯 Sessão configurada com sucesso!\n');

        // 5. Send a text to trigger response
        console.log('5. Enviando mensagem de texto...');
        ws.send(JSON.stringify({
          realtimeInput: { text: 'Olá! Liste os artigos disponíveis.' },
        }));
        console.log('   Mensagem "Olá! Liste os artigos disponíveis." enviada\n');
        return;
      }

      if (data.serverContent) {
        const turn = data.serverContent;

        if (turn.interrupted) {
          console.log('   ⚡ serverContent.interrupted');
          return;
        }
        if (turn.turnComplete) {
          console.log('   ✅ turnComplete — fim da resposta\n');
          return;
        }

        if (turn.modelTurn) {
          for (const part of turn.modelTurn.parts || []) {
            if (part.inlineData?.mimeType?.startsWith('audio/')) {
              audioChunks++;
              const size = part.inlineData.data.length;
              if (!gotFirstAudio) {
                gotFirstAudio = true;
                console.log(`   🔊 PRIMEIRO ÁUDIO RECEBIDO! MIME: ${part.inlineData.mimeType}, chunk: ~${Math.round(size * 0.75 / 1000)}KB (base64)`);
              } else {
                process.stdout.write(`\r   🔊 Áudio chunks: ${audioChunks} (total ~${Math.round(audioChunks * size * 0.75 / 1024)}KB)`);
              }
            }
            if (part.text) {
              textChunks++;
              console.log(`   📝 Texto: "${part.text}"`);
            }
          }
        }
        return;
      }

      if (data.toolCall) {
        toolCalls++;
        const calls = (data.toolCall.functionCalls || []).map(fc => `"${fc.name}"`).join(', ');
        console.log(`   🔧 toolCall RECEBIDO: ${calls}`);

        for (const fc of (data.toolCall.functionCalls || [])) {
          ws.send(JSON.stringify({
            toolResponse: {
              functionResponses: [{
                id: fc.id,
                name: fc.name,
                response: { result: { message: `Resultado simulado para ${fc.name}` } },
              }],
            },
          }));
          console.log(`   ✅ toolResponse enviado para "${fc.name}"`);
        }
        return;
      }

      otherMessages++;
      const keys = Object.keys(data).join(', ');
      console.log(`   ℹ️ Outra mensagem: { ${keys} }`);
    }

    ws.onclose = (event) => {
      clearTimeout(timer);
      console.log(`\n   🔒 WebSocket fechado: code=${event.code}, reason="${event.reason}", wasClean=${event.wasClean}`);
      resolve({ reason: `close:${event.code} "${event.reason}"`, setupDone, audioChunks, textChunks, toolCalls, otherMessages, binaryCount });
    };

    ws.onerror = (err) => {
      console.error('   ❌ WebSocket error:', err.message || err);
    };
  });

  // 6. Summary
  console.log('\n=== RESUMO DO TESTE ===');
  console.log(`   setupComplete:     ${result.setupDone ? '✅ SIM' : '❌ NÃO'}`);
  console.log(`   Chunks de áudio:   ${result.audioChunks}`);
  console.log(`   Textos recebidos:  ${result.textChunks}`);
  console.log(`   Tool calls:        ${result.toolCalls}`);
  console.log(`   Msgs binárias:     ${result.binaryCount}`);
  console.log(`   Outras mensagens:  ${result.otherMessages}`);
  console.log(`   Motivo do fim:     ${result.reason}`);

  if (result.setupDone && result.audioChunks > 0) {
    console.log('\n✅ TESTE PASSOU — Conexão, setup E áudio funcionando!');
  } else if (result.setupDone && result.toolCalls > 0) {
    console.log('\n⚠️  Setup OK mas sem áudio — tool calls funcionaram');
  } else if (result.setupDone) {
    console.log('\n⚠️  Setup OK mas sem resposta — a IA pode estar esperando áudio do mic');
  } else {
    console.log('\n❌ TESTE FALHOU — Setup não foi confirmado');
  }

  ws.close();
}

main().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
