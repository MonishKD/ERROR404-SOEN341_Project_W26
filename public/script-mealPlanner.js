// script file for meal planner

function setTodayDate() {
    const today = new Date();
    // Format as YYYY-MM-DD
    const formattedDate = today.toISOString().split('T')[0];
    
    document.getElementById("weekPicker").value = formattedDate;

    mealPlannerDate();
}
window.onload = setTodayDate;

function mealPlannerDate() {
    const dateContainer = document.getElementById("mealplanWeekDate");
    dateContainer.innerHTML = "";

    const spanMonth = document.createElement("span");
    const spanWeek = document.createElement("span");

    spanMonth.className = "week-month";
    spanWeek.className = "week-range";

    const inputValue = document.getElementById("weekPicker").value;

    const selectedDate = inputValue ? new Date(inputValue) : new Date();

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
}

function mealPlannerWeek(input) {
    const inputDate = document.getElementById("weekPicker");
    
    let date = inputDate.value ? new Date(inputDate.value) : new Date();

    // Move 7 days
    if(input == "next"){
        date.setDate(date.getDate() + 7);
    } else if (input == "prev"){
        date.setDate(date.getDate() - 7);
    }

    // Go to Monday of that week
    const day = date.getDay(); // 0 = Sunday
    const diffToMonday = (day === 0 ? -6 : 1 - day);
    date.setDate(date.getDate() + diffToMonday);

    // Update input value
    inputDate.value = date.toISOString().split("T")[0];

    mealPlannerDate();
}