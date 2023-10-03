
(() => {
  // Variables globales
  let tiempoPregunta = 30;
  let tiempoTotal = 0;
  let tiempoRestante = tiempoPregunta;
  let juegoEnCurso = false;
  let cantCorrectas = 0;
  let cantIncorrectas = 0;
  let preguntaActual = 0;
  let preguntas = [];
  let tiempoInicioPregunta = 0;
  let cronometroIntervalo;
  let cronometroTotalIntervalo;
  let username ="";

  // Obtener elementos HTML
  const $fetchAsync = document.getElementById("fetch-async");
  const $fragment = document.createDocumentFragment();
  const startButton = document.getElementById("comenzar");
  const loginContainer = document.getElementById("login-container");
  const intentarNuevamente = document.getElementById("intentarNuevamente");
  const msjVacio = document.getElementById("msjVacio");
  const $cronometroH1 = document.createElement("h1");
  const mostrarTop20Button = document.getElementById('top20');
  const $segundos = document.createElement("span");
  $cronometroH1.appendChild(document.createTextNode("Tiempo restante: "));
  $segundos.id = "segundos";
  $cronometroH1.appendChild($segundos);
  const sonidoCorrecta = new Audio('./public/sonidos/sonidoCorrecto.mp3');
  const sonidoIncorrecta = new Audio('./public/sonidos/sonidoIncorrecto.mp3');
 const top20Container = document.getElementById('containertop20'); // Obtén el contenedor de los 20 mejores usuarios
 
 mostrarTop20Button.addEventListener('click', () => {
   if (top20Container.style.display === 'none') {

     mostrarTop20Button.textContent = 'Ocultar Top 20';
     top20Container.style.display = 'block';
     mostrarTop20Button.disabled = true; 
     fetch('/api/top-20-users')
       .then((response) => response.json())
       .then((data) => {
         const top20List = document.getElementById('top20-list');
  
         top20List.innerHTML = ''; 
         data.forEach((usuario, index) => {
           const listItem = document.createElement('li');
           listItem.classList.add('itemTop20');
            listItem.textContent = `${index + 1})-${usuario.username} ----- Respuestas correctas: ${usuario.cantCorrectas} -----    Tiempo total: ${usuario.tiempoTotal} segundos`;
           top20List.appendChild(listItem);
         });
 
         // Habilita nuevamente el botón
         mostrarTop20Button.disabled = false;
       })
       .catch((error) => {
         console.error('Error al obtener los mejores usuarios:', error);
         mostrarTop20Button.disabled = false; // Habilita el botón en caso de error
       });
   } else {
     // Si el contenedor está visible, ocúltalo y actualiza el texto del botón
     mostrarTop20Button.textContent = 'Mostrar Top 20';
     top20Container.style.display = 'none';
   }
 });
 
  // Evento click del botón "Comenzar"
  startButton.addEventListener("click", () => {
    if (!juegoEnCurso) {
      username = document.getElementById("username").value.trim();
      if (username === "") {
        document.getElementById("username").style.border = "4px solid black";
        msjVacio.style.display = "block";
        return;
      }
      // Oculta el formulario de inicio
      loginContainer.style.display = "none";
      // Oculta el mensaje de campo vacío
      msjVacio.style.display = "none";
      containertop20.style.display = "none";
      juegoEnCurso = true;
      setTimeout(() => {
        $fetchAsync.style.display = "block";
        const loadingMessage = document.createElement("h1");
        loadingMessage.textContent = "Cargando...";
        $fetchAsync.appendChild(loadingMessage);
        getData();
        iniciarCronometroTotal();
      }); 
    }
  });

  // Función para obtener datos de la API
  const getData = async () => {
    try {
      const res = await fetch('/api/data'); // Hacer la solicitud al servidor
  
      if (!res.ok) {
        throw new Error("Ocurrió un error al solicitar los datos");
      }
  
      const json = await res.json();
      preguntas = generarPregunta(json);
      mostrarPregunta(preguntas[preguntaActual]);
    } catch (err) {
      console.error(err);
    }
  };

  // Función para iniciar el cronómetro total
  const iniciarCronometroTotal = () => {
    cronometroTotalIntervalo = setInterval(() => {
      tiempoTotal++; 
    }, 1000);
  };

  // Función para generar preguntas aleatorias
  const generarPregunta = (json) => {
    const preguntasGeneradas = [];
  
    while (preguntasGeneradas.length < 10) {
      const index = Math.floor(Math.random() * json.length);
      const country = json[index];
      const preguntaRandmon = Math.random() < 0.5 ? "capital" : "flag";
      const pregunta = {
        type: preguntaRandmon,
        countryName: country.translations.spa.common || country.name.common,
      };
  
      if (preguntaRandmon === "capital") {
        pregunta.respuestaCorrecta = country.capital[0];
      } else {
        pregunta.respuestaCorrecta =
          country.translations.spa.common || country.name.common;
        pregunta.flag = country.flags.png;
      }
  
      // Obtener respuestas incorrectas y asegurarse de tener 3 respuestas incorrectas
      pregunta.respuestasIncorrectas = obtenerRespuestasIncorrectas(
        json,
        pregunta.respuestaCorrecta,
        preguntaRandmon
      );
  
      // Agregar esta pregunta solo si hay suficientes respuestas incorrectas
      if (pregunta.respuestasIncorrectas.length === 3) {
        preguntasGeneradas.push(pregunta);
      }
    }
  
    return preguntasGeneradas;
  };
  // Función para obtener respuestas incorrectas
  const obtenerRespuestasIncorrectas = (
    json,
    respuestaCorrecta,
    tipoPregunta
  ) => {
    const respuestasIncorrectas = [];
    while (respuestasIncorrectas.length < 3) {
      const randomIndex = Math.floor(Math.random() * json.length);
      const randomCountry = json[randomIndex];
      let respuestaIncorrecta;
  
      if (tipoPregunta === "capital") {
        respuestaIncorrecta = randomCountry.capital?.[0];
      } else {
        respuestaIncorrecta =
          randomCountry.translations.spa.common || randomCountry.name.common;
      }
  
      if (
        respuestaIncorrecta &&
        respuestaIncorrecta !== respuestaCorrecta &&
        !respuestasIncorrectas.includes(respuestaIncorrecta)
      ) {
        respuestasIncorrectas.push(respuestaIncorrecta);
      }
    }
  
    return respuestasIncorrectas;
  };

  // Función para mostrar una pregunta en la interfaz
  const mostrarPregunta = (pregunta) => {
    $fetchAsync.innerHTML = "";
    tiempoRestante = tiempoPregunta;
    tiempoInicioPregunta = Date.now(); 
    actualizarCronometro();

    const $preguntaContainer = document.createElement("div");
    $preguntaContainer.classList.add("pregunta-container");

    const $preguntaActual = document.createElement("h2");
    $preguntaActual.textContent = `Pregunta ${preguntaActual + 1}/${preguntas.length}`;
    $preguntaContainer.appendChild($preguntaActual);

    const $pregunta = document.createElement("h3");
    $pregunta.textContent =
      pregunta.type === "capital"
        ? `¿Cuál es la capital de "${pregunta.countryName}"?`
        : `¿A qué país corresponde la siguiente bandera?`;
    $preguntaContainer.appendChild($pregunta);

    if (pregunta.type === "flag") {
      const $img = document.createElement("img");
      $img.src = pregunta.flag;
      $img.alt = `Bandera de ${pregunta.countryName}`;
      $img.width = 170;
      $preguntaContainer.appendChild($img);
    }

    const $options = document.createElement("ul");
    const optionsArray = [
      pregunta.respuestaCorrecta,
      ...pregunta.respuestasIncorrectas,
    ];
    optionsArray.sort(() => Math.random() - 0.5);

    optionsArray.forEach((option) => {
      const $option = document.createElement("li");
      $option.textContent = option;

      // Deshabilita la opción temporalmente
      $option.disabled = true;

      $options.appendChild($option);
    });

    $preguntaContainer.appendChild($options);

    $fragment.appendChild($preguntaContainer);
    $fetchAsync.appendChild($fragment);

    // Habilita las opciones después de 1 segundo
    setTimeout(() => {
      const opciones = document.querySelectorAll("li");
      opciones.forEach(($opcion) => {
        $opcion.disabled = false;
        $opcion.addEventListener("click", clickHandler);
      });
    }, 800);
  };

  // Función para manejar el evento de clic en una opción de respuesta
  const clickHandler = (event) => {
    evaluarRespuesta(event.target, preguntas[preguntaActual]);
  };

  // Función para evaluar la respuesta seleccionada
  const evaluarRespuesta = ($opcion, pregunta) => {
    clearInterval(cronometroIntervalo);

    if ($opcion && $opcion.textContent === pregunta.respuestaCorrecta) {
      cantCorrectas++;
      $opcion.classList.add("correcta");
      sonidoCorrecta.play();
    } else {
      cantIncorrectas++;
      sonidoIncorrecta.play();
      const opciones = document.querySelectorAll("li");

      for (const opcion of opciones) {
        if (opcion.textContent === pregunta.respuestaCorrecta) {
          opcion.classList.add("correcta");
          break;
        }
      }
      if ($opcion) {
        $opcion.classList.add("incorrecta");
      }
    }

    const opciones = document.querySelectorAll("li");

    for (const opcion of opciones) {
      opcion.removeEventListener("click", clickHandler);
    }

    preguntaActual++;
    if (preguntaActual < preguntas.length) {
      setTimeout(() => {
        mostrarPregunta(preguntas[preguntaActual]);
      }, 2500);
    } else {
      mostrarResultado();
    }
  };

  // Función para actualizar el cronómetro
  const actualizarCronometro = () => {
    const $cronometro = document.createElement("div");
    $cronometro.classList.add("cronometro");
  
    const $cronometroH1 = document.createElement("h1");
    $cronometroH1.innerHTML = `Tiempo restante: <span id="segundos">${tiempoRestante}</span> `;
  
    $cronometro.appendChild($cronometroH1);
    $fetchAsync.appendChild($cronometro);
  
    cronometroIntervalo = setInterval(() => {
      const tiempoTranscurrido = Math.floor(
        (Date.now() - tiempoInicioPregunta) / 1000
      );
      tiempoRestante = tiempoPregunta - tiempoTranscurrido;
  
      const $segundos = document.getElementById("segundos");
  
      if (tiempoRestante > 10) {
        $segundos.style.color = "green";
      } else {
        $segundos.style.fontSize = "40px";
        $segundos.style.color = "red";
      }
  
      if (tiempoRestante < 0) {
        tiempoRestante = 0;
      }
  
      $segundos.textContent = tiempoRestante;
  
      if (tiempoRestante <= 0) {
        clearInterval(cronometroIntervalo);
        cantIncorrectas++;
        mostrarTiempoAgotado();
        preguntaActual++;
        if (preguntaActual < preguntas.length) {
          setTimeout(() => {
            mostrarPregunta(preguntas[preguntaActual]);
          }, 2000);
        } else {
          mostrarResultado();
        }
      }
    }, 1000);
  };

  // Función para mostrar "Tiempo Agotado"
  const mostrarTiempoAgotado = () => {
    const preguntaActualObj = preguntas[preguntaActual];
    const respuestaCorrecta = preguntaActualObj.respuestaCorrecta;
    $fetchAsync.innerHTML = `
      <div class="tiempo-agotado">
        <h1>Tiempo Agotado</h1>
        <h2>La respuesta se considera incorrecta.</h2>
        <h2>La respuesta correcta era: </h2>
        <h3 class="respuesta-correcta">${respuestaCorrecta}</h3>
      </div>
    `;
  };
  
  intentarNuevamente.addEventListener("click", () => {
    tiempoTotal = 0;
    cantCorrectas = 0;
    cantIncorrectas = 0;
    preguntaActual = 0;
    intentarNuevamente.style.display = "none";
    iniciarCronometroTotal();
    getData();
  });
  // Función para mostrar el resultado final del cuestionario
  const mostrarResultado = () => {
    clearInterval(cronometroIntervalo);
    clearInterval(cronometroTotalIntervalo);

    const minutos = Math.floor(tiempoTotal / 60);
    const segundos = tiempoTotal % 60;
    const enviarInfo=()=>{
 
  
    }
    $fetchAsync.innerHTML = `
      <h1>¡Cuestionario finalizado!</h1>
      <h3>${username} TUS RESULTADOS SON LOS SIGUIENTES!</h3>      <h3 class="respuesta-correcta">Respuestas correctas: ${cantCorrectas}</h3>
      <h3 class="respuestas-incorrectas">Respuestas incorrectas: ${cantIncorrectas}</h3>
      <h3>Tiempo total: ${minutos} minutos ${segundos} segundos</h3>
      <h3>Tiempo promedio: ${tiempoTotal/10} segundos</h3>`;
    intentarNuevamente.style.display = "block";
    
    const enviarDatosAServidor = () => {
      const datos = {
        username,
        cantCorrectas,
        tiempoTotal,
      };
    
      fetch('/api/insert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datos),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log('Datos enviados al servidor:', data);
        })
        .catch((error) => {
          console.error('Error al enviar datos al servidor:', error);
        });
    };
    enviarDatosAServidor();
  };
})();

