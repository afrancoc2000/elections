import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";

const electionView = {
  template: () => import("../views/ElectionView.vue"),
  props: ["address"],
};

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
    },
    {
      path: "/election/:address",
      name: "election",
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import("../views/ElectionView.vue"),
    },
  ],
});

export default router;
