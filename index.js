const ellipsizeStr = (str, len) => {
  if (str.length <= len)
    return str

  else
    return str.substr(0, len - 3) + '...'
}

const ellipsizeDataURL = (str) => {
  return ellipsizeStr(str, 400)
}

const createNewPasteEl = (type) => {
  const el = document.querySelector(`.templates .paste.${ type }`).cloneNode(true)
  document.querySelector('.results').prepend(el)
  return el
}

const handleImage = (item) => {
  const blob = item.getAsFile()
  const reader = new FileReader()

  reader.onload = (event) => {
    const dataURL = event.target.result
    const el = createNewPasteEl('image')
    const originalEl = el.querySelector('.original')
    const textareaEl = el.querySelector('.converted .textarea')
    const copyInput = el.querySelector('.converted input.copy-input')
    const actionsEl = el.querySelector('.actions')

    const img = new Image()
    img.src = dataURL
    originalEl.appendChild(img)

    textareaEl.textContent = ellipsizeDataURL(dataURL)

    const openLink = document.createElement('a')
    openLink.href = dataURL
    openLink.textContent = 'Open'
    actionsEl.appendChild(openLink)

    const copyLink = document.createElement('a')
    copyLink.href = dataURL
    copyLink.textContent = 'Copy'
    actionsEl.appendChild(copyLink)

    const copy = (event) => {
      event.preventDefault()

      copyInput.value = dataURL
      copyInput.select()

      try {
        document.execCommand('copy')
        // TODO - success message
        copyInput.blur()
      }

      catch (err) {
        console.error('Could not run document.execCommand(\'copy\')')
      }
    }

    copyLink.addEventListener('click', copy)
    copyInput.addEventListener('click', copy)

    // console.log(blob.name || 'Pasted image', blob.size, blob.type, img.width, img.height) // TODO

    el.classList.add('done')
  }

  reader.readAsDataURL(blob)
}

const handleData = (item) => {
  const blob = item.getAsFile()
  const reader = new FileReader()

  reader.onload = (event) => {
    const dataURL = event.target.result
    const el = createNewPasteEl('data')
    const textareaEl = el.querySelector('.textarea')
    const actionsEl = el.querySelector('.actions')

    textareaEl.textContent = ellipsizeDataURL(dataURL)

    const openLink = document.createElement('a')
    openLink.href = dataURL
    openLink.textContent = 'Open'
    actionsEl.appendChild(openLink)

    // console.log(blob.name || 'Pasted data', blob.size, blob.type) // TODO

    el.classList.add('done')
  }

  reader.readAsDataURL(blob)
}

const handleText = (item) => {
  item.getAsString((str) => {
    const el = createNewPasteEl('text')
    el.classList.add('done')
    el.querySelector('.original .textarea').textContent = str
    el.querySelector('.converted .textarea').textContent = str

    // TODO - prettify HTML/CSS/JS, clean up SVG, etc.

    // TODO
    // let blob = item.getAsFile()
    // console.log(blob.name || 'Pasted text', str.length)
  })
}

const handleEvents = (event) => {
  event.preventDefault()

  const items = (event.clipboardData || event.dataTransfer).items

  Array.prototype.forEach.call(items, (item) => {
    if (item.kind === 'file' && item.type.match('^image/')) {
      handleImage(item)
    }

    //else if.. // TODO - handle text files, svg files etc.

    else if (item.kind === 'file') {
      handleData(item)
    }

    else if (item.kind === 'string') {
      handleText(item)
    }
  })

  document.querySelector('h1').style.display = 'none' // TODO - fade out?
}

window.addEventListener('paste', handleEvents)

document.addEventListener('drag', (event) => event.preventDefault())
document.addEventListener('dragover', (event) => event.preventDefault())
document.addEventListener('drop', handleEvents)
