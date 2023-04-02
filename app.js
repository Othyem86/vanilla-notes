// Register the service worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
}

/**
 * The Vanilla Notes App.
 */
class App {
  /**
   * Creates the app.
   */
  constructor() {
    // The stored notes
    this.notes = JSON.parse(localStorage.getItem("notes")) || [];

    // Clicked note references
    this.title = "";
    this.text = "";
    this.id = "";

    // DOM references
    this.$placeholder = document.querySelector("#placeholder");
    this.$form = document.querySelector("#form");
    this.$notes = document.querySelector("#notes");
    this.$noteTitle = document.querySelector("#note-title");
    this.$noteText = document.querySelector("#note-text");
    this.$formButtons = document.querySelector("#form-buttons");
    this.$formCloseButton = document.querySelector("#form-close-button");
    this.$modal = document.querySelector(".modal");
    this.$modalTitle = document.querySelector(".modal-title");
    this.$modalText = document.querySelector(".modal-text");
    this.$modalCloseButton = document.querySelector(".modal-close-button");
    this.$colorToolTip = document.querySelector("#color-tooltip");

    // Add event listeners
    this.addEventListeners();

    // Render notes
    this.render();
  }

  /**
   * Adds the necessary event listeners to the document.
   */
  addEventListeners() {
    document.body.addEventListener("click", (event) => {
      this.handleFormClick(event);
      this.selectNote(event);
      this.openModal(event);
      this.deleteNote(event);
    });

    document.body.addEventListener("mouseover", (event) => {
      this.openToolTip(event);
    });

    document.body.addEventListener("mouseout", (event) => {
      this.closeToolTip(event);
    });

    this.$colorToolTip.addEventListener("mouseover", function () {
      this.style.display = "flex";
    });

    this.$colorToolTip.addEventListener("mouseout", function () {
      this.style.display = "none";
    });

    this.$colorToolTip.addEventListener("click", (event) => {
      const color = event.target.dataset.color;
      if (color) {
        this.editNoteColor(color);
      }
    });

    this.$form.addEventListener("submit", (event) => {
      event.preventDefault();
      const title = this.$noteTitle.value;
      const text = this.$noteText.value;
      const hasNote = title || text;

      if (hasNote) {
        this.addNote({ title, text });
      }
    });

    this.$formCloseButton.addEventListener("click", (event) => {
      event.stopPropagation();
      this.closeForm();
    });

    this.$modalCloseButton.addEventListener("click", (event) => {
      this.closeModal(event);
    });
  }

  /**
   * Handles the event when the form is clicked.
   * @param {event} event The event to be handled.
   */
  handleFormClick(event) {
    const isFormClicked = this.$form.contains(event.target);

    const title = this.$noteTitle.value;
    const text = this.$noteText.value;
    const hasNote = title || text;

    if (isFormClicked) {
      this.openForm();
    } else if (hasNote) {
      this.addNote({ title, text });
    } else {
      this.closeForm();
    }
  }

  /**
   * Opens the form.
   */
  openForm() {
    this.$form.classList.add("form-open");
    this.$noteTitle.style.display = "block";
    this.$formButtons.style.display = "block";
  }

  /**
   * Closes the form.
   */
  closeForm() {
    this.$form.classList.remove("form-open");
    this.$noteTitle.style.display = "none";
    this.$formButtons.style.display = "none";
    this.$noteTitle.value = "";
    this.$noteText.value = "";
  }

  /**
   * Opens the modal that edits the clicked note.
   * @param {event} event The event to be handled.
   */
  openModal(event) {
    if (event.target.matches(".toolbar-delete")) {
      return;
    }

    if (event.target.closest(".note")) {
      this.$modal.classList.toggle("open-modal");
      this.$modalTitle.value = this.title;
      this.$modalText.value = this.text;
    }
  }

  /**
   * Closes the modal that edits and commits the changes to the clicked note.
   * @param {event} event The event to be handled.
   */
  closeModal(event) {
    this.editNote();
    this.$modal.classList.toggle("open-modal");
  }

  /**
   * Opens the tooltip responsible for choosing the selected note's color.
   * @param {event} event The event to be handled.
   */
  openToolTip(event) {
    if (!event.target.matches(".toolbar-color")) {
      return;
    }
    this.id = event.target.dataset.id;
    const noteCoords = event.target.getBoundingClientRect();
    const horizontal = noteCoords.left;
    const vertical = window.scrollY - 20;
    this.$colorToolTip.style.transform = `translate(${horizontal}px, ${vertical}px)`;
    this.$colorToolTip.style.display = "flex";
  }

  /**
   * Closes the tooltip responsible for choosing the selected note's color.
   * @param {event} event The event to be handled.
   */
  closeToolTip(event) {
    if (!event.target.matches(".toolbar-color")) {
      return;
    }
    this.$colorToolTip.style.display = "none";
  }

  /**
   * Creates a new note.
   * @param {object} note The object representing the new note.
   * @param {string} note.title The title of the new note.
   * @param {string} note.text The text of the new note.
   */
  addNote({ title, text }) {
    const newNote = {
      title,
      text,
      color: "white",
      id: this.notes.length > 0 ? this.notes[this.notes.length - 1].id + 1 : 1,
    };

    this.notes = [...this.notes, newNote];
    this.render();
    this.closeForm();
  }

  /**
   * Selects the clicked note.
   * @param {event} event The event to be handled.
   */
  selectNote(event) {
    const $selectedNote = event.target.closest(".note");
    if (!$selectedNote) return;
    const [$noteTitle, $noteText] = $selectedNote.children;
    this.title = $noteTitle.innerText;
    this.text = $noteText.innerText;
    this.id = $selectedNote.dataset.id;
  }

  /**
   * Deletes the selected note.
   * @param {event} event The event to be handled.
   */
  deleteNote(event) {
    event.stopPropagation();
    if (!event.target.matches(".toolbar-delete")) {
      return;
    }
    const id = event.target.dataset.id;
    this.notes = this.notes.filter(note => note.id != Number(id));
    this.render();
  }

  /** Edits the clicked note. */
  editNote() {
    const title = this.$modalTitle.value;
    const text = this.$modalText.value;
    this.notes = this.notes.map((note) =>
      note.id === Number(this.id) ? { ...note, title, text } : note
    );
    this.render();
  }

  /**
   * Edits the color of the selected note.
   * @param {event} event The event to be handled.
   */
  editNoteColor(color) {
    this.notes = this.notes.map((note) =>
      note.id === Number(this.id) ? { ...note, color } : note
    );
    this.render();
  }

  /**
   * Renders the app's content.
   */
  render() {
    this.saveNotes();
    this.displayNotes();
  }

  /**
   * Saves the notes in the local storage.
   */
  saveNotes() {
    localStorage.setItem("notes", JSON.stringify(this.notes));
  }

  /**
   * Displays all stored notes.
   */
  displayNotes() {
    const hasNotes = this.notes.length > 0;
    this.$placeholder.style.display = hasNotes ? "none" : "flex";

    this.$notes.innerHTML = this.notes
      .map(
        (note) => `
          <div style="background: ${note.color};" class="note" data-id="${note.id}">
            <div class="${note.title && "note-title"}">${note.title}</div>
            <div class="note-text">${note.text}</div>
              <div class="toolbar-container">
                <div class="toolbar">
                  <img class="toolbar-delete" data-id=${note.id} src="images/bin.svg">
                  <img class="toolbar-color" data-id=${note.id} src="images/palette.svg">
                </div>
              </div>
            </div>
          </div>
        `
      )
      .join("");
  }
}

// Create the app
new App();
