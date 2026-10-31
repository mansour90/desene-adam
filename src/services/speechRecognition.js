/**
 * Serviciu pentru recunoașterea vocală în limba română (ro-RO).
 * Include detecția browserului Brave (care blochează serviciul Google Speech implicit)
 * și oferă ghidaj exact pentru activare.
 */

export async function isBraveBrowser() {
  if (navigator.brave && typeof navigator.brave.isBrave === 'function') {
    return await navigator.brave.isBrave();
  }
  return false;
}

export class SpeechService {
  constructor() {
    this.SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.isSupported = !!this.SpeechRecognitionClass;
    this.activeRecognition = null;
    this.isListening = false;
  }

  checkSupported() {
    return this.isSupported;
  }

  /**
   * Pornește ascultarea vocii cu instanță proaspătă
   */
  async startListening({ onResult, onError, onEnd, onStart }) {
    if (!this.isSupported || !this.SpeechRecognitionClass) {
      if (onError) onError({
        type: 'unsupported',
        message: 'Recunoașterea vocală necesită browserul Google Chrome sau Microsoft Edge.'
      });
      return;
    }

    // Oprim orice instanță anterioară
    this.stopListening();

    try {
      const recognition = new this.SpeechRecognitionClass();
      this.activeRecognition = recognition;

      recognition.lang = 'ro-RO';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      let hasEnded = false;

      recognition.onstart = () => {
        this.isListening = true;
        if (onStart) onStart();
      };

      recognition.onresult = (event) => {
        if (event.results && event.results.length > 0) {
          const transcript = event.results[0][0]?.transcript || '';
          if (onResult && transcript.trim()) {
            onResult(transcript.trim());
          }
        }
      };

      recognition.onerror = async (event) => {
        this.isListening = false;
        const errType = event.error;
        let userMessage = 'Nu am înțeles. Te rugăm să încerci din nou!';
        const isBrave = await isBraveBrowser();

        if (errType === 'network') {
          if (isBrave) {
            userMessage = 'Brave blochează serviciul vocal Google în mod implicit. Deschide o filă cu brave://settings/system și activează „Use Google services for speech recognition”.';
          } else {
            userMessage = 'Serviciul vocal nu a putut fi contactat. Asigură-te că ești conectat la internet sau deschide aplicația în Microsoft Edge.';
          }
        } else if (errType === 'not-allowed') {
          userMessage = 'Accesul la microfon a fost refuzat. Apasă pe lacătul sau pictograma de microfon din bara de adrese a browserului și alege „Permite”.';
        } else if (errType === 'no-speech') {
          userMessage = 'Nu s-a auzit niciun sunet. Apasă din nou pe microfon și vorbește clar!';
        } else if (errType === 'audio-capture') {
          userMessage = 'Nu a fost detectat niciun microfon funcțional pe acest dispozitiv.';
        }

        if (onError) {
          onError({
            type: errType,
            isBrave,
            message: userMessage
          });
        }
      };

      recognition.onend = () => {
        this.isListening = false;
        if (!hasEnded) {
          hasEnded = true;
          if (onEnd) onEnd();
        }
      };

      recognition.start();
    } catch (err) {
      this.isListening = false;
      console.warn('Eroare start SpeechRecognition:', err);
      if (onError) {
        onError({
          type: 'general',
          isBrave: false,
          message: 'Nu s-a putut inițializa microfonul. Reîncearcă sau deschide în Microsoft Edge.'
        });
      }
      if (onEnd) onEnd();
    }
  }

  stopListening() {
    if (this.activeRecognition) {
      try {
        this.activeRecognition.abort();
      } catch (e) {}
      this.activeRecognition = null;
    }
    this.isListening = false;
  }
}

export const speechServiceInstance = new SpeechService();
