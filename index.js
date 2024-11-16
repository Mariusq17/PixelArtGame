//! Variabile DOM
let gridContainer = document.getElementsByClassName("gridContainer")[0];
let colorPallete = document.getElementsByClassName("colorPallete")[0];
const downloadBtn = document.getElementsByClassName("downloadBtn")[0];
let fileInput = document.getElementById("fileInput");
const localImages = document.getElementsByClassName("image");

//! Variabile Auxiliare pentru stocare date
var colors = [],
  distinctColors;
var myData;
let img = new Image();
var gridItemsMatrix = [];

//! Variabile auxiliare pentru creare joc
var width = 32,
  height = 32,
  scale = 3,
  colorShiftGrade = 6,
  imageScale = 32;

//! Variabile auxiliare pentru indexare
let lastColorIndex, currentColorIndex;
let numberOfTiles;

//! MAIN:
let div = localImages[0];
const style = window.getComputedStyle(div, false);
const backgroundImage = style.backgroundImage.slice(4, -1).replace(/"/g, "");

restartGame(backgroundImage, width, height, scale, colorShiftGrade);
//! =====================================================

//! Event Liesteners pentru elemente din DOM

//! Descarca imaginea curenta cand aceasta este completata in joc (jocul
//! s-a terminat)
downloadBtn.addEventListener("click", () => {
  if (!downloadBtn.classList.contains("disable")) saveToFile(imageScale);
});

//! Ia o imagine data de user, ii creeaza un preview si reincepe un
//! joc nou cu setarile imaginii selectate
fileInput.addEventListener("change", () => {
  if (fileInput.files[0]) {
    var reader = new FileReader();
    src = "./dontExist.webp";
    document.getElementById("preview").src = src;
    if (fileInput.files[0]) {
      reader.readAsDataURL(fileInput.files[0]);
    } else {
      src = "./dontExist.webp";
    }
    reader.onloadend = function () {
      src = reader.result;
      restartGame(src, width, height, scale, colorShiftGrade);
      document.getElementById("preview").src = src;
    };
  }
});

//! La apasarea pe o imagine din galeria de poze locale, se va restarta jocul
//! cu imaginea selectata (extragand url ul imaginii dat in CSS)
for (let i = 0; i < localImages.length; i++) {
  localImages[i].addEventListener("click", () => {
    let div = localImages[i];
    const style = window.getComputedStyle(div, false);
    const backgroundImage = style.backgroundImage
      .slice(4, -1)
      .replace(/"/g, "");

    restartGame(backgroundImage, width, height, scale, colorShiftGrade);
  });
}

//! Functii Fabrica (creatoare de obiecte)

//! Creeaza un patratel de culoare din gridul imaginii cu toate proprietatile acestuia
function getNewGridItem(itemColor, scale, x, y, width, height) {
  const gridItem = document.createElement("div");
  const colorIndex = distinctColors.indexOf(itemColor);

  gridItem.classList.add("gridItem");
  gridItem.classList.add("hideColor");

  gridItem.setAttribute("itemColor", itemColor);
  gridItem.setAttribute("poz-x", x);
  gridItem.setAttribute("poz-y", y);
  gridItem.setAttribute("colorIndex", distinctColors.indexOf(itemColor));

  gridItem.style.width = `${8 * scale}px`;
  gridItem.style.height = `${8 * scale}px`;
  // gridItem.innerText = distinctColors.indexOf(itemColor);

  // gridItem.style.backgroundColor = gridItem.getAttribute("itemColor");

  gridItem.addEventListener("click", () => {
    if (currentColorIndex == undefined || currentColorIndex != colorIndex)
      return;

    if (gridItem.classList.contains("hideColor")) {
      numberOfTiles--;
      if (numberOfTiles <= 0) gameEnd();
    }

    gridItem.classList.remove("hideColor");
    gridItem.innerText = "";
    gridItem.style.backgroundColor = gridItem.getAttribute("itemColor");

    let hiddenColors = document.querySelectorAll(
      `.gridItem.hideColor[colorIndex="${colorIndex}"]`
    );
    if (hiddenColors.length == 0) {
      //culoarea din paleta
      document
        .querySelector(`.colorDisc[colorIndex="${colorIndex}"]`)
        .classList.add("disable");
    }
  });

  gridItem.addEventListener("dblclick", () => {
    let i, j, value;
    i = parseInt(gridItem.getAttribute("poz-x"));
    j = parseInt(gridItem.getAttribute("poz-y"));
    value = gridItemsMatrix[i][j];

    if (
      currentColorIndex == undefined ||
      currentColorIndex != parseInt(gridItem.getAttribute("colorIndex"))
    )
      return;

    if (value == -1) return;

    fillColor(i, j, value, width, height);

    let hiddenColors = document.querySelectorAll(
      `.gridItem.hideColor[colorIndex="${colorIndex}"]`
    );
    if (hiddenColors.length == 0) {
      //culoarea din paleta
      document
        .querySelector(`.colorDisc[colorIndex="${colorIndex}"]`)
        .classList.add("disable");
    }

    if (numberOfTiles <= 0) gameEnd();
  });

  return gridItem;
}

//! Creaza o culoare in paleta de culori
function createNewColor(color, index) {
  let newColor = document.createElement("div");
  newColor.classList.add("color");

  let colorDisc = document.createElement("div");
  colorDisc.classList.add("colorDisc");
  colorDisc.style.backgroundColor = color;
  colorDisc.setAttribute("colorIndex", index);

  colorDisc.addEventListener("click", () => {
    if (colorDisc.classList.contains("disable")) return;
    currentColorIndex = index;
    selectColor(lastColorIndex, currentColorIndex);
    lastColorIndex = currentColorIndex;
  });

  let colorNumber = document.createElement("div");
  colorNumber.classList.add("colorNumber");
  colorNumber.innerText = index;

  newColor.append(colorDisc);
  newColor.append(colorNumber);

  return newColor;
}

//! Functii utilitare

//! Modifica scale-ul imaginii incarcate la un numar de maxWidth pixeli pe latime
//! si maxHeight pixeli pe inaltime, salvand in vectorul de culori paleta extinsa de
//! culori pe baza informatiilor stocate in descrierea pixelilor (urmand ca aceasta
//! sa fie simplificata ulterior, deoarece se poate ajunge la mii de culori distincte)
function resizeImage(image, maxWidth, maxHeight) {
  let canvas = document.createElement("canvas");
  //   var width = image.width;
  //   var height = image.height;
  let width = maxWidth;
  let height = maxHeight;

  // Set the canvas dimensions to the new dimensions
  canvas.width = width;
  canvas.height = height;

  // Draw the resized image on the canvas
  let ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, width, height);

  // Insert the canvas into the DOM or use it otherwise
  //   document.body.appendChild(canvas);

  myData = ctx.getImageData(0, 0, width, height);

  for (let i = 0; i < myData.width; i++) {
    for (let j = 0; j < myData.height; j++) {
      red = myData.data[i * myData.width * 4 + 4 * j + 0];
      green = myData.data[i * myData.width * 4 + 4 * j + 1];
      blue = myData.data[i * myData.width * 4 + 4 * j + 2];
      alpha = myData.data[i * myData.width * 4 + 4 * j + 3];

      const itemColor = `rgba(${red}, ${green}, ${blue}, ${alpha})`;

      colors.push(itemColor);
    }
  }
}

//! Simplifica spatiul de culoare scapand de cei mai nesemnificativi colorShiftGrade
//! biti, actualizand vectorul de culori si returnand un vector cu paleta de culori
//! modificata
function simplifyColors(colorShiftGrade) {
  distinctColors = new Set();
  for (let index = 0; index < colors.length; index++) {
    let element = colors[index];
    element = element.slice(5, element.length - 1);
    let numbers = element.split(", ");
    for (let i = 0; i < numbers.length - 1; i++) {
      numbers[i] = parseInt(numbers[i]);
      numbers[i] = numbers[i] >> colorShiftGrade;
      numbers[i] = numbers[i] << colorShiftGrade;
    }
    r = numbers[0];
    g = numbers[1];
    b = numbers[2];
    a = numbers[3];
    colors[index] = `rgba(${r}, ${g}, ${b}, ${a})`;
    distinctColors.add(colors[index]);
  }
  distinctColors = [...distinctColors];
  return distinctColors;
}

//! Functie care ne spune daca am iesit din dimensiunea matricei
function isOutOfBorder(i, j, numOfRows, numOfCols) {
  if (i < 0 || i >= numOfRows) return true;
  if (j < 0 || j >= numOfCols) return true;
  return false;
}
//! Functia aceasta umple toate patratele alaturate adiacent cu aceeasi valoare,
//! cu culoarea corespunzatoare
function fillColor(i, j, val, width, height) {
  if (!isOutOfBorder(i, j, width, height)) {
    if (gridItemsMatrix[i][j] == val) {
      gridItemsMatrix[i][j] = -1;

      gridItem = document
        .getElementsByClassName("gridContainer")[0]
        .querySelector(`[poz-x = "${i}"][poz-y = "${j}"]`);

      if (gridItem.classList.contains("hideColor")) {
        numberOfTiles--;
        if (numberOfTiles <= 0) gameEnd();
      }

      gridItem.classList.remove("hideColor");
      gridItem.innerText = "";
      gridItem.style.backgroundColor = gridItem.getAttribute("itemColor");

      fillColor(i, j - 1, val, width, height);
      fillColor(i, j + 1, val, width, height);
      fillColor(i - 1, j, val, width, height);
      fillColor(i + 1, j, val, width, height);
    }
  }
}

//! Creeaza o imagine si un link de download pentru
//! imaginea curenta
function saveToFile(imageScale) {
  let myNewData = myData;
  var newCanvas = document.createElement("canvas");

  // Setăm dimensiunea scalată pentru păstrarea efectului pixelat
  newCanvas.width = myNewData.width * imageScale;
  newCanvas.height = myNewData.height * imageScale;

  var ctx = newCanvas.getContext("2d");
  ctx.imageSmoothingEnabled = false; // Dezactivăm anti-aliasing-ul
  ctx.putImageData(myNewData, 0, 0);

  // Scalăm imaginea pentru efect pixelat
  ctx.drawImage(
    newCanvas,
    0,
    0,
    myNewData.width,
    myNewData.height,
    0,
    0,
    newCanvas.width,
    newCanvas.height
  );

  // Salvăm imaginea procesată
  var dURL = newCanvas.toDataURL("image/png");

  // Creează un element de tip link pentru a descărca imaginea
  const downloadLink = document.createElement("a");
  downloadLink.href = dURL;
  downloadLink.download = "image.png"; // Numele fișierului descărcat
  downloadLink.click(); // Simulează click-ul pe link pentru a iniția descărcarea
}

//! Adauga un preview a unei imagini selectate de user intr-un
//! tag HTML img
function previewFile() {
  var preview = document.querySelector("img");
  var file = document.querySelector("input[type=file]").files[0];
  var reader = new FileReader();

  reader.onloadend = function () {
    preview.src = reader.result;
  };

  if (file) {
    reader.readAsDataURL(file);
  } else {
    preview.src = "";
  }
}

//! Actualizarea paletei de culori cu culorile corespunzatoare
//! imaginii curente
function updateColorPallete() {
  colorPallete.innerHTML = "";

  for (let index = 0; index < distinctColors.length; index++) {
    colorPallete.append(createNewColor(distinctColors[index], index));
  }
}

//! Optiunea de selectare a unei culori din paleta si de a
//! marca in tabla de joc selectarea sa
function selectColor(lastColorIndex, colorIndex) {
  if (lastColorIndex != undefined) {
    let lastSelectedGridItem = document.querySelectorAll(
      `[colorIndex="${lastColorIndex}"]`
    );
    for (let i = 0; i < lastSelectedGridItem.length; i++) {
      lastSelectedGridItem[i].innerText = "";
    }
  }

  let selectedGridItem = document.querySelectorAll(
    `.gridItem[colorIndex="${colorIndex}"]`
  );

  for (let i = 0; i < selectedGridItem.length; i++) {
    if (selectedGridItem[i].classList.contains("hideColor"))
      selectedGridItem[i].innerText = colorIndex;
  }
}

//! Functii rulare / oprire joc

//! Pornirea / Repornirea jocului (reinitializarea jocului)
function restartGame(imgSrc, width, height, scale, colorShiftGrade) {
  numberOfTiles = width * height;

  if (!downloadBtn.classList.contains("disable")) {
    downloadBtn.classList.add("disable");
    console.log("Butonul a fost dezactivat");
  }

  gridItemsMatrix = [];
  colors = [];

  img.src = imgSrc;

  gridContainer.innerHTML = "";

  img.onload = function () {
    gridContainer.style.gridTemplateColumns = `repeat(${width}, auto)`;
    document.documentElement.style.setProperty(
      "--width",
      `${width * 8 * scale - 1}px`
    );

    // Imaginea este incarcata; acum, redimensionează-l
    resizeImage(img, width, height);

    distinctColors = simplifyColors(colorShiftGrade);

    for (let i = 0; i < width; i++) {
      gridItemsMatrix.push([]);
      for (let j = 0; j < height; j++) {
        gridContainer.append(
          getNewGridItem(colors[i * width + j], scale, i, j, width, height)
        );
        gridItemsMatrix[i].push(distinctColors.indexOf(colors[i * width + j]));
      }
    }

    updateColorPallete();
  };
}

//! Sfarsitul jocului (activeaza butonul de download)
function gameEnd() {
  if (downloadBtn.classList.contains("disable")) {
    console.log("Butonul a fost activat");
    downloadBtn.classList.remove("disable");
  }
}
