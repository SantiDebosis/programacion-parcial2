const API_URL = "https://restcountries.com/v3.1/subregion/Northern%20Europe?fields=name,capital,currencies,flags"
const COUNTRIES_PER_PAGE = 6

let allCountries = []
let filteredCountries = []
let currentPage = 1
let totalPages = 1

// Elementos del DOM
const loadingEl = document.getElementById("loading")
const errorEl = document.getElementById("error")
const containerEl = document.getElementById("countries-container")
const gridEl = document.getElementById("countries-grid")
const prevBtn = document.getElementById("prev-btn")
const nextBtn = document.getElementById("next-btn")
const pageInfo = document.getElementById("page-info")

// Elementos de los filtros
const searchInput = document.getElementById("search-input")
const currencyFilter = document.getElementById("currency-filter")
const sortFilter = document.getElementById("sort-filter")
const clearBtn = document.getElementById("clear-filters")

// Función para obtener los países de la API
async function fetchCountries() {
  try {
    showLoading()
    const response = await fetch(API_URL)

    if (!response.ok) {
      throw new Error("Error al obtener los datos")
    }

    const countries = await response.json()
    allCountries = countries
    filteredCountries = [...countries]

    populateCurrencyFilter()
    applyFiltersAndSort()
    setupEventListeners()
    hideLoading()
  } catch (error) {
    console.error("Error:", error)
    showError()
  }
}

// Función para llenar el filtro de monedas
function populateCurrencyFilter() {
  const currencies = new Set()

  allCountries.forEach((country) => {
    if (country.currencies) {
      Object.values(country.currencies).forEach((currency) => {
        currencies.add(currency.name)
      })
    }
  })

  const sortedCurrencies = Array.from(currencies).sort()

  currencyFilter.innerHTML = '<option value="">Todas las monedas</option>'
  sortedCurrencies.forEach((currency) => {
    const option = document.createElement("option")
    option.value = currency
    option.textContent = currency
    currencyFilter.appendChild(option)
  })
}

// Función para poder aplicar filtros y ordenamiento
function applyFiltersAndSort() {
  let filtered = [...allCountries]

  // Filtro por búsqueda de nombre
  const searchTerm = searchInput.value.toLowerCase().trim()
  if (searchTerm) {
    filtered = filtered.filter((country) => country.name.common.toLowerCase().includes(searchTerm))
  }

  // Filtro por moneda
  const selectedCurrency = currencyFilter.value
  if (selectedCurrency) {
    filtered = filtered.filter((country) => {
      if (!country.currencies) return false
      return Object.values(country.currencies).some((currency) => currency.name === selectedCurrency)
    })
  }

  // Ordenamiento segun el abecedario
  const sortOption = sortFilter.value
  filtered.sort((a, b) => {
    const nameA = a.name.common.toLowerCase()
    const nameB = b.name.common.toLowerCase()

    if (sortOption === "name-asc") {
      return nameA.localeCompare(nameB)
    } else if (sortOption === "name-desc") {
      return nameB.localeCompare(nameA)
    }
    return 0
  })

  filteredCountries = filtered
  currentPage = 1
  totalPages = Math.ceil(filteredCountries.length / COUNTRIES_PER_PAGE)

  displayCountries()
  updatePaginationInfo()
}

// Función para mostrar los países de la página actual
function displayCountries() {
  if (filteredCountries.length === 0) {
    gridEl.innerHTML = '<div class="no-results">No se encontraron países que coincidan con los filtros.</div>'
    return
  }

  const startIndex = (currentPage - 1) * COUNTRIES_PER_PAGE
  const endIndex = startIndex + COUNTRIES_PER_PAGE
  const countriesForPage = filteredCountries.slice(startIndex, endIndex)

  gridEl.innerHTML = ""

  countriesForPage.forEach((country) => {
    const countryCard = createCountryCard(country)
    gridEl.appendChild(countryCard)
  })
}

// Función para crear una card para cada país
function createCountryCard(country) {
  const card = document.createElement("div")
  card.className = "country-card"

  const commonName = country.name.common
  const capital = country.capital ? country.capital[0] : "No disponible"
  const flagUrl = country.flags.png

  // Obtener información de las monedas
  let currencyInfo = "No disponible"
  if (country.currencies) {
    const currencyNames = Object.values(country.currencies).map((curr) => curr.name)
    currencyInfo = currencyNames.join(", ")
  }

  card.innerHTML = `
        <img src="${flagUrl}" alt="Bandera de ${commonName}" class="country-flag">
        <div class="country-card-content">
            <h3>${commonName}</h3>
            <p><strong>Capital:</strong> ${capital}</p>
            <p><strong>Moneda:</strong> ${currencyInfo}</p>
            <button class="details-btn" onclick="goToDetails('${encodeURIComponent(commonName)}')">
                Ver más detalles
            </button>
        </div>
    `

  return card
}

// Función para configurar los event listeners
function setupEventListeners() {
  searchInput.addEventListener("input", debounce(applyFiltersAndSort, 300))

  currencyFilter.addEventListener("change", applyFiltersAndSort)
  sortFilter.addEventListener("change", applyFiltersAndSort)

  clearBtn.addEventListener("click", clearAllFilters)

  prevBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--
      displayCountries()
      updatePaginationInfo()
      scrollToTop()
    }
  })

  nextBtn.addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage++
      displayCountries()
      updatePaginationInfo()
      scrollToTop()
    }
  })
}

// Función para limpiar todos los filtros
function clearAllFilters() {
  searchInput.value = ""
  currencyFilter.value = ""
  sortFilter.value = "name-asc"
  applyFiltersAndSort()
}

// Función debounce para optimizar la búsqueda
function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Función para hacer scroll hacia arriba
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" })
}

// Función para actualizar la información de paginación
function updatePaginationInfo() {
  if (totalPages === 0) {
    pageInfo.textContent = "No hay resultados"
    prevBtn.disabled = true
    nextBtn.disabled = true
  } else {
    pageInfo.textContent = `Página ${currentPage} de ${totalPages} (${filteredCountries.length} países)`
    prevBtn.disabled = currentPage === 1
    nextBtn.disabled = currentPage === totalPages
  }
}

// Función para ir a la página de detalles
function goToDetails(countryName) {
  window.location.href = `details.html?country=${countryName}`
}

// Funciones de utilidad para mostrar/ocultar elementos
function showLoading() {
  loadingEl.classList.remove("hidden")
  errorEl.classList.add("hidden")
  containerEl.classList.add("hidden")
}

function hideLoading() {
  loadingEl.classList.add("hidden")
  containerEl.classList.remove("hidden")
}

function showError() {
  loadingEl.classList.add("hidden")
  containerEl.classList.add("hidden")
  errorEl.classList.remove("hidden")
}

// Función goToDetails global para que sea accesible desde el HTML
window.goToDetails = goToDetails

// Inicializar la aplicación
document.addEventListener("DOMContentLoaded", fetchCountries)
