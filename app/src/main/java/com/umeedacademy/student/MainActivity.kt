package com.umeedacademy.student

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

private val Navy = Color(0xFF101D48)
private val Red = Color(0xFFD71920)
private val Yellow = Color(0xFFFFD21C)
private val Ink = Color(0xFF17213B)
private val Muted = Color(0xFF788198)
private val Canvas = Color(0xFFF5F6FA)
private val Line = Color(0xFFE8EAF0)

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent { UmeedApp() }
    }
}

private enum class Tab(val label: String) {
    Home("Home"), Courses("Courses"), Materials("Materials"), Tests("Tests"), Profile("Profile")
}

@Composable
private fun UmeedApp() {
    var selected by remember { mutableStateOf(Tab.Home) }
    var signedIn by remember { mutableStateOf(false) }
    var studentName by remember { mutableStateOf("Ayaan Ahmad") }

    MaterialTheme(
        colorScheme = lightColorScheme(
            primary = Navy, secondary = Red, tertiary = Yellow,
            background = Canvas, surface = Color.White
        )
    ) {
        if (!signedIn) {
            LoginScreen(
                onLogin = { name ->
                    studentName = name.ifBlank { "Ayaan Ahmad" }
                    signedIn = true
                }
            )
        } else {
            Scaffold(
                containerColor = Canvas,
                bottomBar = {
                    NavigationBar(containerColor = Color.White, tonalElevation = 8.dp) {
                        Tab.entries.forEach { tab ->
                            NavigationBarItem(
                                selected = selected == tab,
                                onClick = { selected = tab },
                                icon = {
                                    Icon(
                                        when (tab) {
                                            Tab.Home -> Icons.Default.Home
                                            Tab.Courses -> Icons.Default.MenuBook
                                            Tab.Materials -> Icons.Default.FolderOpen
                                            Tab.Tests -> Icons.Default.Assignment
                                            Tab.Profile -> Icons.Default.Person
                                        }, contentDescription = tab.label
                                    )
                                },
                                label = { Text(tab.label, fontSize = 10.sp) },
                                colors = NavigationBarItemDefaults.colors(
                                    selectedIconColor = Red,
                                    selectedTextColor = Navy,
                                    indicatorColor = Color(0xFFFFE9E9)
                                )
                            )
                        }
                    }
                }
            ) { padding ->
                when (selected) {
                    Tab.Home -> HomeScreen(studentName, Modifier.padding(padding))
                    Tab.Courses -> CoursesScreen(Modifier.padding(padding))
                    Tab.Materials -> MaterialsScreen(Modifier.padding(padding))
                    Tab.Tests -> TestsScreen(Modifier.padding(padding))
                    Tab.Profile -> ProfileScreen(studentName, Modifier.padding(padding)) {
                        signedIn = false
                        selected = Tab.Home
                    }
                }
            }
        }
    }
}

@Composable
private fun LoginScreen(onLogin: (String) -> Unit) {
    var name by remember { mutableStateOf("Ayaan Ahmad") }
    var password by remember { mutableStateOf("umeed123") }
    Box(Modifier.fillMaxSize().background(Brush.verticalGradient(listOf(Navy, Color(0xFF263B78))))) {
        Column(
            Modifier.fillMaxWidth().align(Alignment.Center).padding(horizontal = 26.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Box(
                Modifier.size(86.dp).clip(RoundedCornerShape(26.dp)).background(Color.White),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Default.School, null, tint = Red, modifier = Modifier.size(48.dp))
            }
            Spacer(Modifier.height(18.dp))
            Text("UMEED ACADEMY", color = Color.White, fontSize = 27.sp, fontWeight = FontWeight.Black)
            Text("A NEW HOPE FOR BRIGHT FUTURE", color = Yellow, fontSize = 11.sp, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(38.dp))
            Card(shape = RoundedCornerShape(28.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
                Column(Modifier.padding(24.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                    Text("Student login", fontSize = 23.sp, fontWeight = FontWeight.Bold, color = Ink)
                    Text("Welcome back. Sign in to continue learning.", color = Muted, fontSize = 13.sp)
                    OutlinedTextField(
                        value = name, onValueChange = { name = it }, label = { Text("Student name") },
                        leadingIcon = { Icon(Icons.Default.Person, null) }, singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = password, onValueChange = { password = it }, label = { Text("Password") },
                        leadingIcon = { Icon(Icons.Default.Lock, null) }, singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    Button(
                        onClick = { onLogin(name) }, modifier = Modifier.fillMaxWidth().height(52.dp),
                        shape = RoundedCornerShape(15.dp), colors = ButtonDefaults.buttonColors(containerColor = Red)
                    ) { Text("Sign in", fontWeight = FontWeight.Bold) }
                    Text("DEMO ACCESS  •  Any name and password", color = Muted, fontSize = 10.sp)
                }
            }
        }
        Text("STUDENT PORTAL  •  DEMO BUILD", Modifier.align(Alignment.BottomCenter).padding(22.dp),
            color = Color.White.copy(alpha = .65f), fontSize = 10.sp, fontWeight = FontWeight.SemiBold)
    }
}

@Composable
private fun Page(modifier: Modifier = Modifier, content: @Composable ColumnScope.() -> Unit) {
    Column(modifier.fillMaxSize().background(Canvas)) { content() }
}

@Composable
private fun Header(title: String, subtitle: String? = null) {
    Column(Modifier.fillMaxWidth().background(Color.White).padding(horizontal = 20.dp, vertical = 17.dp)) {
        Text(title, fontSize = 23.sp, fontWeight = FontWeight.Bold, color = Ink)
        if (subtitle != null) {
            Spacer(Modifier.height(3.dp))
            Text(subtitle, color = Muted, fontSize = 12.sp)
        }
    }
}

@Composable
private fun HomeScreen(name: String, modifier: Modifier = Modifier) {
    Page(modifier) {
        Header("Umeed Academy", "Your learning journey starts here")
        LazyColumn(
            contentPadding = PaddingValues(start = 18.dp, end = 18.dp, top = 18.dp, bottom = 22.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f)) {
                        Text("Good morning,", color = Muted, fontSize = 13.sp)
                        Text(name, color = Ink, fontSize = 22.sp, fontWeight = FontWeight.Bold)
                    }
                    Box(Modifier.size(44.dp).clip(CircleShape).background(Color(0xFFFFE9E9)), contentAlignment = Alignment.Center) {
                        Icon(Icons.Default.NotificationsNone, null, tint = Red)
                    }
                }
            }
            item {
                Box(Modifier.fillMaxWidth().clip(RoundedCornerShape(23.dp)).background(
                    Brush.linearGradient(listOf(Red, Color(0xFF9E1018)))
                ).padding(20.dp)) {
                    Column {
                        Text("LEARN • PRACTISE • SUCCEED", color = Yellow, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                        Spacer(Modifier.height(9.dp))
                        Text("A brighter future\nbegins with today's effort.", color = Color.White, fontSize = 22.sp, fontWeight = FontWeight.ExtraBold)
                        Spacer(Modifier.height(15.dp))
                        Text("Explore your classes and learning resources.", color = Color.White.copy(alpha = .85f), fontSize = 12.sp)
                    }
                }
            }
            item {
                SectionTitle("Your learning")
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    StatCard("04", "Subjects", Icons.Default.MenuBook, Modifier.weight(1f))
                    StatCard("02", "Upcoming tests", Icons.Default.Assignment, Modifier.weight(1f))
                    StatCard("08", "New notes", Icons.Default.Description, Modifier.weight(1f))
                }
            }
            item {
                SectionTitle("Announcements", "View all")
                NoticeCard("Weekly mock test", "A practice test is scheduled for Saturday at 10:00 AM.", "Today")
            }
            item {
                SectionTitle("Continue learning")
                CourseRow("Biology", "Human Physiology", "Chapter 04 • 12 pages", Color(0xFFEAF2FF), Icons.Default.Science)
                CourseRow("Chemistry", "Chemical Bonding", "Chapter 03 • 18 pages", Color(0xFFFFF3E5), Icons.Default.Biotech)
            }
            item {
                Text("Demo content • Replaceable with academy data", color = Muted, fontSize = 10.sp,
                    modifier = Modifier.fillMaxWidth().padding(top = 4.dp))
            }
        }
    }
}

@Composable
private fun SectionTitle(title: String, action: String? = null) {
    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Text(title, Modifier.weight(1f), color = Ink, fontSize = 16.sp, fontWeight = FontWeight.Bold)
        if (action != null) Text(action, color = Red, fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
    }
    Spacer(Modifier.height(10.dp))
}

@Composable
private fun StatCard(value: String, label: String, icon: androidx.compose.ui.graphics.vector.ImageVector, modifier: Modifier = Modifier) {
    Card(modifier, shape = RoundedCornerShape(17.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
        Column(Modifier.padding(12.dp)) {
            Icon(icon, null, tint = Red, modifier = Modifier.size(19.dp))
            Spacer(Modifier.height(12.dp))
            Text(value, fontSize = 21.sp, fontWeight = FontWeight.Bold, color = Ink)
            Text(label, fontSize = 10.sp, color = Muted, maxLines = 1, overflow = TextOverflow.Ellipsis)
        }
    }
}

@Composable
private fun NoticeCard(title: String, body: String, time: String) {
    Card(shape = RoundedCornerShape(17.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
        Row(Modifier.padding(15.dp), verticalAlignment = Alignment.Top) {
            Box(Modifier.size(38.dp).clip(RoundedCornerShape(12.dp)).background(Color(0xFFFFE9E9)), contentAlignment = Alignment.Center) {
                Icon(Icons.Default.Campaign, null, tint = Red)
            }
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text(title, color = Ink, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                Spacer(Modifier.height(4.dp))
                Text(body, color = Muted, fontSize = 11.sp)
            }
            Text(time, color = Red, fontSize = 10.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun CourseRow(subject: String, topic: String, detail: String, tint: Color, icon: androidx.compose.ui.graphics.vector.ImageVector) {
    Card(Modifier.fillMaxWidth().padding(bottom = 9.dp), shape = RoundedCornerShape(17.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White)) {
        Row(Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(Modifier.size(44.dp).clip(RoundedCornerShape(13.dp)).background(tint), contentAlignment = Alignment.Center) {
                Icon(icon, null, tint = Navy)
            }
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text(subject, color = Red, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                Text(topic, color = Ink, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                Text(detail, color = Muted, fontSize = 10.sp)
            }
            Icon(Icons.Default.ChevronRight, null, tint = Muted)
        }
    }
}

@Composable
private fun CoursesScreen(modifier: Modifier = Modifier) {
    Page(modifier) {
        Header("My courses", "Explore your enrolled subjects")
        LazyColumn(Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(11.dp)) {
            item { CourseRow("Biology", "NEET Biology", "Botany & Zoology • 24 chapters", Color(0xFFE8F3FF), Icons.Default.Eco) }
            item { CourseRow("Physics", "NEET Physics", "Mechanics, electricity & more", Color(0xFFFFF0E5), Icons.Default.Bolt) }
            item { CourseRow("Chemistry", "NEET Chemistry", "Physical, organic & inorganic", Color(0xFFEDEBFF), Icons.Default.Science) }
            item { CourseRow("Foundation", "Mathematics", "Class 9–10 foundation", Color(0xFFE8F7EF), Icons.Default.Calculate) }
            item { CourseRow("Commerce", "Accountancy", "DAAR'S • Sample course", Color(0xFFFFF5D9), Icons.Default.AccountBalance) }
        }
    }
}

@Composable
private fun MaterialsScreen(modifier: Modifier = Modifier) {
    var filter by remember { mutableStateOf("All") }
    val materials = listOf(
        Triple("Human Physiology — Notes", "Biology • PDF • 12 pages", "PDF"),
        Triple("Chemical Bonding — Handout", "Chemistry • PDF • 18 pages", "PDF"),
        Triple("Motion in a Straight Line", "Physics • PDF • 9 pages", "PDF"),
        Triple("Weekly Revision Sheet", "General • Worksheet • 4 pages", "DOC")
    )
    Page(modifier) {
        Header("Study materials", "Notes and resources shared by teachers")
        Row(Modifier.fillMaxWidth().padding(horizontal = 18.dp, vertical = 14.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            listOf("All", "PDF", "Worksheets").forEach { item ->
                FilterChip(selected = filter == item, onClick = { filter = item }, label = { Text(item) })
            }
        }
        LazyColumn(contentPadding = PaddingValues(horizontal = 18.dp, vertical = 4.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            items(materials.filter { filter == "All" || (filter == "PDF" && it.third == "PDF") || (filter == "Worksheets" && it.third == "DOC") }) { item ->
                Card(shape = RoundedCornerShape(17.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
                    Row(Modifier.fillMaxWidth().clickable { }.padding(15.dp), verticalAlignment = Alignment.CenterVertically) {
                        Box(Modifier.size(42.dp).clip(RoundedCornerShape(12.dp)).background(Color(0xFFFFE9E9)), contentAlignment = Alignment.Center) {
                            Icon(Icons.Default.Description, null, tint = Red)
                        }
                        Spacer(Modifier.width(12.dp))
                        Column(Modifier.weight(1f)) {
                            Text(item.first, color = Ink, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                            Text(item.second, color = Muted, fontSize = 10.sp)
                        }
                        Icon(Icons.Default.Download, null, tint = Navy)
                    }
                }
            }
        }
    }
}

@Composable
private fun TestsScreen(modifier: Modifier = Modifier) {
    Page(modifier) {
        Header("Mock tests", "Practice, review and improve")
        LazyColumn(Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            item { TestCard("NEET Full Syllabus Mock 01", "Saturday • 10:00 AM", "180 questions", "Upcoming") }
            item { TestCard("Biology Chapter Test", "Completed • 18 Nov", "45 questions", "Result: 38/45") }
            item { TestCard("Chemistry Practice Test", "Completed • 12 Nov", "30 questions", "Result: 24/30") }
        }
    }
}

@Composable
private fun TestCard(title: String, date: String, count: String, status: String) {
    Card(shape = RoundedCornerShape(18.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
        Column(Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.Assignment, null, tint = Red)
                Spacer(Modifier.width(9.dp))
                Text(title, color = Ink, fontWeight = FontWeight.Bold, fontSize = 13.sp)
            }
            Spacer(Modifier.height(9.dp))
            Text("$date  •  $count", color = Muted, fontSize = 11.sp)
            Spacer(Modifier.height(12.dp))
            Text(status, color = if (status == "Upcoming") Red else Color(0xFF21865B), fontSize = 11.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun ProfileScreen(name: String, modifier: Modifier = Modifier, onLogout: () -> Unit) {
    Page(modifier) {
        Header("My profile", "Your student account")
        Column(Modifier.fillMaxWidth().padding(18.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Box(Modifier.size(82.dp).clip(CircleShape).background(Navy), contentAlignment = Alignment.Center) {
                Text(name.take(1).uppercase(), color = Color.White, fontSize = 30.sp, fontWeight = FontWeight.Bold)
            }
            Spacer(Modifier.height(12.dp))
            Text(name, color = Ink, fontSize = 20.sp, fontWeight = FontWeight.Bold)
            Text("Student ID: UA-2026-0142", color = Muted, fontSize = 11.sp)
            Spacer(Modifier.height(22.dp))
            ProfileInfo("Enrolled programme", "NEET Preparation")
            ProfileInfo("Batch", "NEET Evening Batch")
            ProfileInfo("Account status", "Active • Demo account")
            ProfileInfo("Institute", "Umeed Academy")
            Spacer(Modifier.height(20.dp))
            OutlinedButton(onClick = onLogout, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(14.dp)) {
                Icon(Icons.Default.Logout, null)
                Spacer(Modifier.width(8.dp))
                Text("Sign out")
            }
        }
    }
}

@Composable
private fun ProfileInfo(label: String, value: String) {
    Card(Modifier.fillMaxWidth().padding(bottom = 9.dp), shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White)) {
        Row(Modifier.fillMaxWidth().padding(15.dp), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(label, color = Muted, fontSize = 12.sp)
            Text(value, color = Ink, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
        }
    }
}
