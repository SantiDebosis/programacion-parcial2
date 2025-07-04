// API más completa para obtener todos los detalles del país
const API_URL = "https://restcountries.com/v3.1/name/"

// Elementos del DOM
const loadingEl = document.getElementById("loading")
const errorEl = document.getElementById("error")
const detailsEl = document.getElementById("country-details")
const titleEl = document.getElementById("country-title")

// Elementos de información básica
const flagEl = document.getElementById("country-flag")
const coatOfArmsEl = document.getElementById("coat-of-arms")
const nameEl = document.getElementById("country-name")
const officialNameEl = document.getElementById("country-official-name")
const populationEl = document.getElementById("population")
const areaEl = document.getElementById("area")

// Elementos de información geográfica
const capitalEl = document.getElementById("capital")
const regionEl = document.getElementById("region")
const subregionEl = document.getElementById("subregion")
const continentsEl = document.getElementById("continents")
const timezonesEl = document.getElementById("timezones")

// Elementos de información cultural
const languagesEl = document.getElementById("languages")
const demonymsEl = document.getElementById("demonyms")
const carSideEl = document.getElementById("car-side")
const fifaEl = document.getElementById("fifa")

// Elementos de monedas y fronteras
const currenciesEl = document.getElementById("currencies-list")
const bordersEl = document.getElementById("borders-list")

// Elementos de información adicional
const independentEl = document.getElementById("independent")
const unMemberEl = document.getElementById("un-member")
const callingCodesEl = document.getElementById("calling-codes")
const tldEl = document.getElementById("tld")

// Función para obtener el parámetro del país de la URL
function getCountryFromURL() {
  const urlParams = new URLSearchParams(window.location.search)
  return urlParams.get("country")
}

// Función para obtener los detalles completos del país
async function fetchCountryDetails() {
  const countryName = getCountryFromURL()

  if (!countryName) {
    showError()
    return
  }

  try {
    showLoading()
    const response = await fetch(`${API_URL}${encodeURIComponent(countryName)}?fullText=true`)

    if (!response.ok) {
      throw new Error("País no encontrado")
    }

    const data = await response.json()
    const country = data[0]

    if (!country) {
      throw new Error("País no encontrado")
    }

    await displayCountryDetails(country)
    hideLoading()
  } catch (error) {
    console.error("Error:", error)
    showError()
  }
}

// Función para mostrar todos los detalles del país
async function displayCountryDetails(country) {
  const commonName = country.name.common
  const officialName = country.name.official

  // Actualizar el título de la página
  titleEl.textContent = `Detalles de ${commonName}`
  document.title = `${commonName} - Detalles del País`

  // Información básica
  flagEl.src = country.flags.png || country.flags.svg
  flagEl.alt = `Bandera de ${commonName}`

  if (country.coatOfArms && country.coatOfArms.png) {
    coatOfArmsEl.src = country.coatOfArms.png
    coatOfArmsEl.alt = `Escudo de ${commonName}`
    coatOfArmsEl.style.display = "block"
  } else {
    coatOfArmsEl.style.display = "none"
  }

  nameEl.textContent = commonName
  officialNameEl.textContent = officialName

  // Estadísticas
  populationEl.textContent = formatNumber(country.population)
  areaEl.textContent = country.area ? `${formatNumber(country.area)} km²` : "No disponible"

  // Información geográfica
  capitalEl.textContent = country.capital ? country.capital.join(", ") : "No disponible"
  regionEl.textContent = country.region || "No disponible"
  subregionEl.textContent = country.subregion || "No disponible"
  continentsEl.textContent = country.continents ? country.continents.join(", ") : "No disponible"
  timezonesEl.textContent = country.timezones ? country.timezones.join(", ") : "No disponible"

  // Información cultural
  displayLanguages(country.languages)
  displayDemonyms(country.demonyms)
  carSideEl.textContent =
    country.car && country.car.side ? (country.car.side === "right" ? "Derecha" : "Izquierda") : "No disponible"
  fifaEl.textContent = country.fifa || "No disponible"

  // Monedas
  displayCurrencies(country.currencies)

  // Países fronterizos
  await displayBorders(country.borders)

  // Información adicional
  independentEl.textContent = country.independent ? "Sí" : "No"
  unMemberEl.textContent = country.unMember ? "Sí" : "No"
  callingCodesEl.textContent =
    country.idd && country.idd.root
      ? `${country.idd.root}${country.idd.suffixes ? country.idd.suffixes.join(", ") : ""}`
      : "No disponible"
  tldEl.textContent = country.tld ? country.tld.join(", ") : "No disponible"
}

// Función para mostrar idiomas
function displayLanguages(languages) {
  if (!languages) {
    languagesEl.innerHTML = "No disponible"
    return
  }

  const languageNames = Object.values(languages)
  languagesEl.innerHTML = languageNames.map((lang) => `<span class="language-tag">${lang}</span>`).join("")
}

// Función para mostrar demónimos
function displayDemonyms(demonyms) {
  if (!demonyms || !demonyms.eng) {
    demonymsEl.textContent = "No disponible"
    return
  }

  const male = demonyms.eng.m || ""
  const female = demonyms.eng.f || ""

  if (male && female && male !== female) {
    demonymsEl.textContent = `${male} / ${female}`
  } else {
    demonymsEl.textContent = male || female || "No disponible"
  }
}

// Función para mostrar las monedas
function displayCurrencies(currencies) {
  currenciesEl.innerHTML = ""

  if (!currencies) {
    currenciesEl.innerHTML = "<p class='no-borders'>No hay información de monedas disponible</p>"
    return
  }

  Object.entries(currencies).forEach(([code, currency]) => {
    const currencyDiv = document.createElement("div")
    currencyDiv.className = "currency-item"

    const symbol = currency.symbol || "N/A"
    const name = currency.name || "N/A"

    currencyDiv.innerHTML = `
      <span class="currency-name">${name} (${code})</span>
      <div class="currency-details">Símbolo: ${symbol}</div>
    `

    currenciesEl.appendChild(currencyDiv)
  })
}

// Función para mostrar países fronterizos
async function displayBorders(borders) {
  bordersEl.innerHTML = ""

  if (!borders || borders.length === 0) {
    bordersEl.innerHTML = "<p class='no-borders'>Este país no tiene fronteras terrestres</p>"
    return
  }

  try {
    // Obtener nombres de países fronterizos
    const borderCountries = await Promise.all(
      borders.map(async (borderCode) => {
        try {
          const response = await fetch(`https://restcountries.com/v3.1/alpha/${borderCode}?fields=name`)
          const data = await response.json()
          return {
            code: borderCode,
            name: data.name.common,
          }
        } catch {
          return {
            code: borderCode,
            name: borderCode,
          }
        }
      }),
    )

    borderCountries.forEach((border) => {
      const borderLink = document.createElement("a")
      borderLink.href = `details.html?country=${encodeURIComponent(border.name)}`
      borderLink.className = "border-country"
      borderLink.textContent = border.name
      bordersEl.appendChild(borderLink)
    })
  } catch (error) {
    bordersEl.innerHTML = "<p class='no-borders'>Error al cargar países fronterizos</p>"
  }
}

// Función para formatear números
function formatNumber(num) {
  if (!num) return "No disponible"
  return new Intl.NumberFormat("es-ES").format(num)
}

// Funciones para mostrar/ocultar elementos
function showLoading() {
  loadingEl.classList.remove("hidden")
  errorEl.classList.add("hidden")
  detailsEl.classList.add("hidden")
}

function hideLoading() {
  loadingEl.classList.add("hidden")
  detailsEl.classList.remove("hidden")
}

function showError() {
  loadingEl.classList.add("hidden")
  detailsEl.classList.add("hidden")
  errorEl.classList.remove("hidden")
}

// Inicializar la aplicación
document.addEventListener("DOMContentLoaded", fetchCountryDetails)
