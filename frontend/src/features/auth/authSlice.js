import { createSlice } from "@reduxjs/toolkit";

const roleToken = localStorage.getItem("resosToken");
const restaurantToken = localStorage.getItem("restaurantToken");
const token = roleToken || restaurantToken;

const initialState = {
    token,
    restaurantId: localStorage.getItem("restaurantId"),
    role: roleToken ? localStorage.getItem("role") : null,
    isAuthenticated: Boolean(token),
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setCredentials: (state, action)=>{
            state.token = action.payload.token;
            state.restaurantId = action.payload.restaurantId;
            state.role = action.payload.role;
            state.isAuthenticated = true;
        },

        logout: (state) =>{
            state.token = null;
            state.restaurantId = null;
            state.role = null;
            state.isAuthenticated = false;
        },
    },
});

export const { setCredentials, logout } = authSlice.actions;

export default authSlice.reducer;