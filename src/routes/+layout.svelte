<script>
    import "../app.css";
    import { desoUsdPrice } from '../Store.js';
    import TopNav from "../components/TopNav.svelte";
</script>

<TopNav />   
  
<slot />

<footer>
    <div class="flex justify-end fixed inset-x-0 bottom-0 p-4">
        <div class="text-gray-400 text-sm">
            <p>Powered by Deso</p>
            <p>DESO Price: ${$desoUsdPrice / 100}</p>
        </div>
    </div>
</footer>    