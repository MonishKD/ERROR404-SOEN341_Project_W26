import { getToken, getInitials, isAuthenticated, createMealPlanItem, logout } from "./script.js";
const API_BASE_URL = "http://localhost:4002/api";

let lastDeletedMeal = null;
let undoTimeout = null;

/**
 * Helper functions
 */
function setTodayDate() {
    const today = new Date();
    // Format as YYYY-MM-DD
    const formattedDate = today.toISOString().split('T')[0];
    
    document.getElementById("weekPicker").value = formattedDate;

    mealPlannerDate();
}
function parseLocalDate(dateString) {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day); // months are 0-indexed
}
function saveSelectedMealSlot(slotData) {
  localStorage.setItem('selectedMealSlot', JSON.stringify(slotData));
}

/**
 * Updates meal planner based on date
 */
function mealPlannerDate() {
    const dateContainer = document.getElementById("mealplanWeekDate");
    dateContainer.innerHTML = "";

    const spanMonth = document.createElement("span");
    const spanWeek = document.createElement("span");

    spanMonth.className = "week-month";
    spanWeek.className = "week-range";

    const inputValue = document.getElementById("weekPicker").value;

    const selectedDate = inputValue ? parseLocalDate(inputValue) : new Date();

    // Month
    const monthFormatter = new Intl.DateTimeFormat("en-US", {
        month: "long",
        year: "numeric"
    });
    spanMonth.textContent = monthFormatter.format(selectedDate);
    
    // Week range
    const startOfWeek = new Date(selectedDate);
    const day = startOfWeek.getDay(); // 0 = Sunday
    const diffToMonday = (day === 0 ? -6 : 1 - day); // adjust to Monday

    startOfWeek.setDate(selectedDate.getDate() + diffToMonday);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const shortFormatter = new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric"
    });
    spanWeek.textContent = `${shortFormatter.format(startOfWeek)} - ${shortFormatter.format(endOfWeek)}`;
    
    dateContainer.appendChild(spanMonth);
    dateContainer.appendChild(spanWeek);

    weeklyMeals(selectedDate);
}
/**
 * Handles week navigation for the meal planner. Updates the date input to the Monday of the selected week and refreshes the meal planner view.
 */
function mealPlannerWeek(input) {
    const inputDate = document.getElementById("weekPicker");

    let date = inputDate.value ? parseLocalDate(inputDate.value) : new Date();

    const currentDay = date.getDay(); // 0 = Sunday
    const diffToMonday = (currentDay === 0 ? -6 : 1 - currentDay);
    date.setDate(date.getDate() + diffToMonday);

    // Move 7 days
    if(input == "next"){
        date.setDate(date.getDate() + 7);
    } else if (input == "prev"){
        date.setDate(date.getDate() - 7);
    }

    // Update input value
    inputDate.value = date.toISOString().split("T")[0];

    mealPlannerDate();
}
/**
 * Load meal plan for the week and populate the grid
 */
async function weeklyMeals(currentDate) {
  const plannerGrid = document.getElementsByClassName("planner-grid")[0];
  plannerGrid.innerHTML = "";

  // create header corner
  const corner = document.createElement("div");
  corner.className = "grid-header-corner";
  plannerGrid.appendChild(corner);

  const currentDay = currentDate.getDay(); // 0 = Sunday
  const diffToMonday = (currentDay === 0 ? -6 : 1 - currentDay);
  const monday = new Date(currentDate);
  monday.setDate(currentDate.getDate() + diffToMonday);

  // header row
  for (let i = 0; i < 7; i++) {
    const day = document.createElement("div");

    const dateForDay = new Date(monday);
    dateForDay.setDate(monday.getDate() + i);

    const today = new Date();
    if (
      dateForDay.getDate() === today.getDate() &&
      dateForDay.getMonth() === today.getMonth() &&
      dateForDay.getFullYear() === today.getFullYear()
    ) {
      day.className = "grid-day-header today";
    } else {
      day.className = "grid-day-header";
    }

    const nameDay = document.createElement("span");
    const dateDay = document.createElement("span");
    nameDay.className = "day-name";
    dateDay.className = "day-date";

    nameDay.textContent = dateForDay.toLocaleDateString("en-US", { weekday: "short" });
    dateDay.textContent = dateForDay.toLocaleDateString("en-US", { day: "numeric" });

    day.appendChild(nameDay);
    day.appendChild(dateDay);

    plannerGrid.appendChild(day);
  }

  // get meal plan for the week
  const mondayStr = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
  console.log("mondayStr being requested:", mondayStr);

  const mealPlanResponse = await fetch(`${API_BASE_URL}/mealPlan/week/${mondayStr}`, {
    headers: {
      'Authorization': `Bearer ${getToken()}`
    }
  });

  console.log("mealPlanResponse status:", mealPlanResponse.status);

  const mealPlan = await mealPlanResponse.json();
  console.log("mealPlan data:", mealPlan)
  
  let mealPlanItems = [];

  if (mealPlan) {
    const itemsResponse = await fetch(`${API_BASE_URL}/mealPlan/${mealPlan.id}/items`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });

    console.log("itemsResponse status:", itemsResponse.status);

    mealPlanItems = await itemsResponse.json();

    console.log("mealPlanItems data:", mealPlanItems);
  }

  const MEAL_TYPES = [
    { type: "BREAKFAST", icon: "🍳", label: "Breakfast" },
    { type: "LUNCH", icon: "🥗", label: "Lunch" },
    { type: "DINNER", icon: "🍽️", label: "Dinner" },
    { type: "SNACK", icon: "🍎", label: "Snack" }
  ];

  const WEEKDAY_ENUM = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
  const startOfWeek = new Date(monday);

  for (const meal of MEAL_TYPES) {
    const mealTypeLabel = document.createElement("div");
    mealTypeLabel.className = "grid-meal-label";

    const icon = document.createElement("span");
    icon.className = "meal-label-icon";
    icon.textContent = meal.icon;

    const text = document.createElement("span");
    text.textContent = meal.label;

    mealTypeLabel.appendChild(icon);
    mealTypeLabel.appendChild(text);
    plannerGrid.appendChild(mealTypeLabel);

    for (let i = 0; i < 7; i++) {
      const grid = document.createElement("div");
      grid.className = "grid-cell";

      const dateForDay = new Date(startOfWeek);
      dateForDay.setDate(startOfWeek.getDate() + i);
      const dayEnum = WEEKDAY_ENUM[dateForDay.getDay()];

      const item = mealPlanItems.find(e =>
        e.meal_type === meal.type &&
        e.day_of_week === dayEnum
      );

    if (item) {
        try {
          // Fetch recipe details for the assigned meal
          const recipe = item.recipe;

          const cellFilled = document.createElement("div");
          cellFilled.className = "cell-filled";

          const recipeName = document.createElement("div");
          recipeName.className = "cell-recipe-name";
          recipeName.textContent = recipe.name;

          const recipeMeta = document.createElement("div");
          recipeMeta.className = "cell-recipe-meta";
          recipeMeta.textContent = `⏱️ ${recipe.prep_time} min · ${recipe.difficulty}`;

          const actions = document.createElement("div");
          actions.className = "cell-filled-actions";

          const editBtn = document.createElement("button");
          editBtn.className = "cell-action-btn cell-btn-edit";
          editBtn.type = "button";
          editBtn.textContent = "✏️ Edit";
          editBtn.addEventListener("click", () => {
            saveSelectedMealSlot({
              itemId: item.id,
              mealPlanId: item.mealPlanId,
              day_of_week: item.day_of_week,
              meal_type: item.meal_type,
              notes: item.notes || ""
            });

            window.location.href = "add-meal.html";
          });

          const removeBtn = document.createElement("button");
          removeBtn.className = "cell-action-btn cell-btn-remove";
          removeBtn.type = "button";
          removeBtn.textContent = "✕";

          // Add confirmation before deletion
            removeBtn.addEventListener("click", async () => {
            const confirmed = confirm(`Are you sure you want to remove "${recipe.name}" from your planner?`);
            if (!confirmed) return;

          // Store details of the deleted meal for potential undo functionality
              lastDeletedMeal = {
              mealPlanId: item.mealPlanId,
              recipeId: item.recipeId,
              day_of_week: item.day_of_week,
              meal_type: item.meal_type,
              notes: item.notes || ""
            };

            try {
              const response = await fetch(`${API_BASE_URL}/mealPlan/items/${item.id}`, {
                method: "DELETE",
                headers: {
                  "Authorization": `Bearer ${getToken()}`
                }
              });

              const data = await response.json();

              if (!response.ok) {
                alert(data.message || "Failed to delete meal assignment.");
                return;
              }
              // Refresh the meal plan grid after deletion
              await weeklyMeals(currentDate);
              showUndoBanner(); // Show undo option after deletion
              
            } catch (error) {
              console.error("Error deleting meal assignment:", error);
              alert("Something went wrong while deleting the meal.");
            }
          });

          actions.appendChild(editBtn);
          actions.appendChild(removeBtn);

          cellFilled.appendChild(recipeName);
          cellFilled.appendChild(recipeMeta);
          cellFilled.appendChild(actions);

          grid.appendChild(cellFilled);
        } catch (error) {
          console.error("Error loading recipe details:", error);
        }
      } else {
        grid.className = "grid-cell empty";

        const addBtn = document.createElement("button");
        addBtn.type = "button";
        addBtn.className = "cell-add-btn";
        addBtn.innerHTML = `
          <span class="add-icon">＋</span>
          <span>Add ${meal.label}</span>
        `;

      addBtn.addEventListener("click", async () => {
        let currentMealPlan = mealPlan;

        if (!currentMealPlan) {
          const weekStart = new Date(monday);
          const weekEnd = new Date(monday);
          weekEnd.setDate(weekEnd.getDate() + 6);

          const result = await createMealPlanForWeek(
            weekStart.toISOString(),
            weekEnd.toISOString()
          );

          if (!result.success) {
            alert(result.error || "Failed to create meal plan.");
            return;
          }

          currentMealPlan = result.data;
        }

        saveSelectedMealSlot({
          mealPlanId: currentMealPlan.id,
          day_of_week: dayEnum,
          meal_type: meal.type
        });

        window.location.href = "add-meal.html";
      });

        grid.appendChild(addBtn);
      }

      plannerGrid.appendChild(grid);
    }
  }
}
/**
 * Creates new meal plan if not existant in database
 */
async function createMealPlanForWeek(weekStartDate, weekEndDate) {
  try {
    const response = await fetch(`${API_BASE_URL}/mealPlan`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        week_start_date: weekStartDate,
        week_end_date: weekEndDate,
        name: 'Weekly Meal Plan'
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to create meal plan');
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
/**
 * Undo functionality for meal deletion
 */
function showUndoBanner() {
    let banner = document.getElementById("undoBanner");

    if (!banner) {
        banner = document.createElement("div");
        banner.id = "undoBanner";
        document.body.appendChild(banner);
    }

    banner.style.position = "fixed";
    banner.style.bottom = "24px";
    banner.style.right = "24px";
    banner.style.background = "#ffffff";
    banner.style.border = "1px solid #e5e7eb";
    banner.style.borderLeft = "4px solid #16a34a";
    banner.style.padding = "18px 22px";
    banner.style.borderRadius = "12px";
    banner.style.boxShadow = "0 8px 20px rgba(0,0,0,0.12)";
    banner.style.zIndex = "9999";
    banner.style.display = "flex";
    banner.style.alignItems = "center";
    banner.style.gap = "12px";
    banner.style.minWidth = "300px";
    banner.style.fontSize = "16px";
    banner.style.transition = "opacity 0.3s ease, transform 0.3s ease";

    banner.style.transform = "translateY(20px)";
    banner.style.opacity = "0"; 

    setTimeout(() => {
    banner.style.opacity = "1";
    banner.style.transform = "translateY(0)";
    }, 10);



    banner.innerHTML = `
    <span style="font-weight: 600; color: #111827;">
        Meal removed — But not too late to undo
    </span>
    <button id="undoDeleteBtn" style="
        background: #16a34a;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
    ">
        Undo
    </button>
    `;

    const undoBtn = document.getElementById("undoDeleteBtn");

    undoBtn.onmouseover = () => {
        undoBtn.style.opacity = "0.9";
    };

    undoBtn.onmouseout = () => {
        undoBtn.style.opacity = "1";
    };

    undoBtn.onclick = async () => {
        if (!lastDeletedMeal) return;

        const result = await createMealPlanItem(
        lastDeletedMeal.mealPlanId,
        lastDeletedMeal.recipeId,
        lastDeletedMeal.day_of_week,
        lastDeletedMeal.meal_type,
        lastDeletedMeal.notes || ""
        );

        if (result.success) {
        lastDeletedMeal = null;
        banner.style.display = "none";
        mealPlannerDate();
        } else {
        alert(result.error || "Failed to restore meal.");
        }
    };

    if (undoTimeout) clearTimeout(undoTimeout);

    undoTimeout = setTimeout(() => {
        banner.style.opacity = "0";
        banner.style.transform = "translateY(10px)";

        setTimeout(() => {
        banner.style.display = "none";
        banner.style.opacity = "1";
        banner.style.transform = "translateY(0)";
        lastDeletedMeal = null;
        }, 300);
    }, 5000);

    banner.onmouseenter = () => {
    if (undoTimeout) clearTimeout(undoTimeout);
    };

    banner.onmouseleave = () => {
    undoTimeout = setTimeout(() => {
        banner.style.opacity = "0";
        banner.style.transform = "translateY(10px)";

        setTimeout(() => {
        banner.style.display = "none";
        lastDeletedMeal = null;
        }, 300);
    }, 3000);
    };

}
// initialization
document.addEventListener('DOMContentLoaded', () => {
    if (!isAuthenticated()) {
        window.location.href = 'login-page.html';
        return;
    }
    
    getInitials();

    const weekPicker = document.getElementById('weekPicker');
    if (weekPicker) {
    setTodayDate();

    weekPicker.addEventListener('change', () => {
        mealPlannerDate();
    });
    }

    const weekButtons = document.querySelectorAll('.week-nav-btn');
    if (weekButtons.length >= 2) {
    weekButtons[0].addEventListener('click', () => mealPlannerWeek('prev'));
    weekButtons[1].addEventListener('click', () => mealPlannerWeek('next'));
    }

    // log out functionality
    logout();
});