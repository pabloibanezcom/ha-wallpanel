class WebAppPanel extends HTMLElement {
  connectedCallback() {
    if (this.shadowRoot) return;

    const root = this.attachShadow({ mode: 'open' });
    root.innerHTML = `
      <style>
        :host {
          display: block;
          height: 100%;
        }

        iframe {
          width: 100%;
          height: 100%;
          border: 0;
          background: transparent;
        }
      </style>
      <iframe src="/local/ha-wallpanel/" referrerpolicy="same-origin"></iframe>
    `;
  }
}

customElements.define('web-app-panel', WebAppPanel);
