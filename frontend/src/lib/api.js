import axios from "axios";
import { FORMSPREE, formspreeConfigured, submitToFormspree } from "./formspree";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const joinWaitlist = (email) => {
  if (formspreeConfigured(FORMSPREE.waitlist)) {
    return submitToFormspree(FORMSPREE.waitlist, {
      email,
      form_type: "waitlist",
      source: window.location.href,
    });
  }
  return axios.post(`${API}/waitlist`, { email });
};

export const sendContact = (payload) => {
  if (formspreeConfigured(FORMSPREE.contact)) {
    return submitToFormspree(FORMSPREE.contact, {
      ...payload,
      form_type: "contact",
      source: window.location.href,
    });
  }
  return axios.post(`${API}/contact`, payload);
};
